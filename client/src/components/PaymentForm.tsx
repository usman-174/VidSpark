// PaymentForm.tsx
import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/authStore";
import { 
  CardElement, 
  useElements, 
  useStripe,
  PaymentRequestButtonElement,
  Elements
} from "@stripe/react-stripe-js";
import { toast } from "react-hot-toast";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { 
  Loader2,
  LockIcon,
  CreditCard,
  ShieldCheck,
  Info,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
});

interface PaymentFormProps {
  selectedPackageId: string;
  loading: boolean;
  setLoading: (val: boolean) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedPackageId,
  loading,
  setLoading,
}) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [securePaymentVisible, setSecurePaymentVisible] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Store payment form ID to help with debugging remounts
  const formId = useRef(`payment-form-${Math.random().toString(36).substring(2, 9)}`);
  
  // Log when component mounts/unmounts for debugging
  useEffect(() => {
    console.log(`PaymentForm mounted: ${formId.current}`);
    
    // Show secure payment info after a delay for better UX
    const timer = setTimeout(() => {
      setSecurePaymentVisible(true);
    }, 1500);
    
    return () => {
      console.log(`PaymentForm unmounted: ${formId.current}`);
      clearTimeout(timer);
    };
  }, []);

  // Form setup with react-hook-form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(`[${formId.current}] Payment submission started`);
    
    if (!stripe) {
      console.error(`[${formId.current}] Stripe not loaded`);
      toast.error("Stripe has not loaded yet.");
      return;
    }
    
    if (!elements) {
      console.error(`[${formId.current}] Elements not available`);
      toast.error("Payment elements are not ready. Please refresh the page.");
      return;
    }

    // Double check the current component is still mounted
    if (!document.getElementById("card-element")) {
      console.error(`[${formId.current}] Card element not in DOM`);
      toast.error("The payment form appears to have changed. Please try again.");
      return;
    }

    // Get the card element directly when processing payment
    const card = elements.getElement(CardElement);
    console.log(`[${formId.current}] Card element retrieved:`, !!card);
    
    if (!card) {
      console.error(`[${formId.current}] Card element not found`);
      toast.error("Card element not found. Please refresh the page.");
      return;
    }

    if (!selectedPackageId) {
      console.error(`[${formId.current}] No package selected`);
      toast.error("Please select a package first.");
      return;
    }

    if (!cardComplete) {
      console.error(`[${formId.current}] Card not complete`);
      toast.error("Please complete your card details.");
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);
    setLoading(true);

    try {
      // Set up error handling and timeout for network requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      console.log(`[${formId.current}] Requesting payment intent`);
      // 1. Request a PaymentIntent from our backend
      const { data } = await axiosInstance.post(
        "/payments/intent",
        {
          creditPackageId: selectedPackageId,
          customerEmail: values.email,
          customerName: values.name,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      // data includes { clientSecret, paymentId }
      const { clientSecret, paymentId } = data;
      console.log(`[${formId.current}] PaymentIntent received, confirming payment`);

      // Before confirming payment, check again if card element is still valid
      if (!document.getElementById("card-element") || !elements.getElement(CardElement)) {
        throw new Error("Payment form changed during processing. Please try again.");
      }

      // 2. Confirm the card payment using Stripe - use the element we just checked
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: values.name,
              email: values.email,
            },
          },
        }
      );

      if (error) {
        console.error(`[${formId.current}] Payment confirmation error:`, error);
        setPaymentError(error.message || "Payment failed.");
        toast.error(error.message || "Payment failed.");
        return;
      }

      // 3. If payment is successful, update our Payment record
      if (paymentIntent?.status === "succeeded") {
        try {
          // Confirm the payment on the backend
          const confirmRes = await axiosInstance.post("/payments/confirm", {
            paymentId,
          });

          if (confirmRes.status === 200) {
            useAuthStore.getState().refreshUser();
            setPaymentSuccess(true);
            toast.success("Payment succeeded! Credits have been added.");
            // Reset the form
            form.reset();
            // Reset card element
            card.clear();
            setCardComplete(false);
          } else {
            toast.error("Payment succeeded but updating credits failed.");
          }
        } catch (confirmError: any) {
          console.error("Error confirming payment:", confirmError);
          toast.error(
            "Payment was successful, but we couldn't update your credits. Please contact support."
          );
        }
      } else if (paymentIntent?.status === "requires_action") {
        // Handle 3D Secure authentication
        const { error: actionError } = await stripe.handleCardAction(clientSecret);
        
        if (actionError) {
          setPaymentError(actionError.message || "Authentication failed.");
          toast.error(actionError.message || "Authentication failed.");
        } else {
          // Try to confirm again after 3D Secure
          const confirmRes = await axiosInstance.post("/payments/confirm", {
            paymentId,
          });
          
          if (confirmRes.status === 200) {
            useAuthStore.getState().refreshUser();
            setPaymentSuccess(true);
            toast.success("Payment succeeded! Credits have been added.");
            form.reset();
            card.clear();
            setCardComplete(false);
          }
        }
      } else {
        toast.error("Payment requires additional verification.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setPaymentError("Request timed out. Please try again.");
        toast.error("Request timed out. Please try again.");
      } else {
        setPaymentError(err.response?.data?.error || "Something went wrong");
        toast.error(err.response?.data?.error || "Something went wrong");
      }
      console.error("Payment error:", err);
    } finally {
      setPaymentProcessing(false);
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8 px-4 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-6">
          Your credits have been added to your account and are ready to use.
        </p>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={()=>navigate("/")}
        >
          Let's Go
        </Button>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form id={formId.current} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <AnimatePresence>
          {securePaymentVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="bg-blue-50 border-blue-100 text-blue-800 mb-6">
                <LockIcon className="h-4 w-4 text-blue-500 mr-2" />
                <AlertDescription className="text-blue-700 text-sm">
                  Your payment information is securely processed using 256-bit SSL encryption. We do not store your card details.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Cardholder Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    className="border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Email</FormLabel>
               
                <FormControl>
                  <Input 
                    placeholder="johndoe@example.com" 
                    type="email" 
                    {...field} 
                    className="border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="card-element" className="text-gray-700">Card Details</FormLabel>
            <div className="flex items-center space-x-1">
              {/* Credit card icons */}
              <svg className="w-6 h-4" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="24" rx="4" fill="#E7E7E7"/>
                <path d="M15.4 15.8H12.6V8.2H15.4V15.8Z" fill="#4B4D4F"/>
                <path d="M12.9 12C12.9 13.4 14.3 14.6 16 14.6C16.6 14.6 17.2 14.4 17.7 14.1L17.4 13.7C17 14 16.5 14.1 16 14.1C14.7 14.1 13.6 13.2 13.6 12C13.6 10.8 14.7 9.9 16 9.9C16.5 9.9 17 10 17.4 10.3L17.7 9.9C17.2 9.6 16.6 9.4 16 9.4C14.3 9.4 12.9 10.6 12.9 12Z" fill="#4B4D4F"/>
                <path d="M27.4 15.8L25.1 12.8L27.1 9.8H26.1L24.6 12.1L23.1 9.8H22.1L24.1 12.8L21.8 15.8H22.8L24.6 13.2L26.4 15.8H27.4Z" fill="#4B4D4F"/>
              </svg>
              <svg className="w-6 h-4" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="24" rx="4" fill="#EEEEEE"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M24.9 6H15.1C13.2 6 11.8 7.5 11.8 9.3V14.7C11.8 16.5 13.3 18 15.1 18H24.9C26.8 18 28.2 16.5 28.2 14.7V9.3C28.3 7.5 26.8 6 24.9 6Z" fill="#FF6B6C"/>
                <path d="M18.8 15.1L20.6 8.9H22.5L20.7 15.1H18.8Z" fill="#444444"/>
                <path d="M17.5 8.9L15.7 13.1L15.5 12.2L15.5 12.1L14.6 9.6C14.6 9.6 14.5 8.9 13.7 8.9H11.1L11 9.1C11 9.1 11.8 9.3 12.7 9.9L14.3 15.1H16.3L19.3 8.9H17.5Z" fill="#444444"/>
                <path d="M28.2 15.1H30L28.5 8.9H27C26.3 8.9 26 9.4 26 9.4L23.4 15.1H25.4L25.8 14H28.1L28.2 15.1ZM26.4 12.5L27.3 10.1L27.8 12.5H26.4Z" fill="#444444"/>
              </svg>
              <svg className="w-6 h-4" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="24" rx="4" fill="#F1F1F1"/>
                <path d="M17.3 14.7H14L15.8 9.3H19.1L17.3 14.7Z" fill="#007ECD"/>
                <path d="M24.5 9.5C23.9 9.3 23 9 21.9 9C19.5 9 17.8 10.2 17.8 12C17.8 13.3 19 14 19.9 14.4C20.8 14.8 21.1 15.1 21.1 15.4C21.1 15.9 20.5 16.1 19.9 16.1C19 16.1 18.5 16 17.6 15.6L17.2 15.4L16.8 17.2C17.5 17.5 18.6 17.7 19.7 17.7C22.3 17.7 24 16.5 24 14.6C24 13.6 23.3 12.8 22 12.3C21.2 12 20.7 11.7 20.7 11.3C20.7 11 21 10.7 21.6 10.7C22.1 10.7 22.5 10.8 23 11L23.3 11.1L23.7 9.4L24.5 9.5Z" fill="#007ECD"/>
                <path d="M27.8 14.7L26.5 14.7L25.7 9.3H27.5C28.1 9.3 28.5 9.5 28.7 10.2L30 14.7H27.8Z" fill="#007ECD"/>
              </svg>
            </div>
          </div>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4 bg-white">
              <div 
                id="card-element-container" 
                className="min-h-[40px] relative"
              >
                <CardElement
                  id="card-element"
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#333",
                        fontFamily: "'Inter', sans-serif",
                        fontSmoothing: "antialiased",
                        "::placeholder": { color: "#9CA3AF" },
                        iconColor: "#6366F1"
                      },
                      invalid: { color: "#EF4444", iconColor: "#EF4444" },
                    },
                    hidePostalCode: true,
                  }}
                  onChange={(e) => {
                    setCardComplete(e.complete);
                    if (e.error) {
                      setPaymentError(e.error.message || null);
                    } else {
                      setPaymentError(null);
                    }
                  }}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md bg-red-50 p-3 text-sm text-red-600 flex items-start"
            >
              <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
              <span>{paymentError}</span>
            </motion.div>
          )}
        </div>

        <Separator className="my-6" />

        <Button
          type="submit"
          className={`w-full py-3 relative ${
            paymentProcessing || loading || !stripe || !elements || !cardComplete || !selectedPackageId
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          } text-white font-medium rounded-md transition-colors`}
          disabled={
            !stripe ||
            !elements ||
            loading ||
            paymentProcessing ||
            !selectedPackageId ||
            !cardComplete
          }
        >
          {paymentProcessing || loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Processing payment...</span>
            </>
          ) : (
            <>
              <LockIcon className="mr-2 h-4 w-4" />
              <span>Pay Securely Now</span>
            </>
          )}
        </Button>
        
        <div className="flex flex-col space-y-3 mt-6">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-500 mr-1.5" />
            <span>Your payment is secured with SSL encryption. We do not store your card details.</span>
          </div>
          <div className="flex justify-center space-x-4">
            <img src="/stripe-logo.svg" alt="Powered by Stripe" className="h-6" />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;