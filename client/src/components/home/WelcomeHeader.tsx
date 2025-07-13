import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardInsights } from "@/api/userInsightsApi";
import { User, Calendar, Activity, CreditCard } from "lucide-react";
import useAuthStore from "@/store/authStore";

interface WelcomeHeaderProps {
  insights: DashboardInsights | null;
  isLoading: boolean;
}

const WelcomeHeader = ({ insights, isLoading }: WelcomeHeaderProps) => {
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-12 w-24" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const { overview } = insights;
  console.log("WelcomeHeader insights:", insights);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
              <User className="mr-2 h-6 w-6" />
              Welcome back, {user?.name || user?.email}!
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Member since{" "}
              {new Date(overview.member_since).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            <CreditCard className="mr-1 h-4 w-4" />
            {overview.credit_balance} credits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {overview.total_feature_usage}
            </div>
            <div className="text-sm text-gray-600">Total Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {overview.activity_streak}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          {overview.favorite_feature ? (
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {overview.favorite_feature}
              </div>
              <div className="text-sm text-gray-600">Favorite Feature</div>
            </div>
          ) : null}
         {overview.last_active? <div className="text-center">
            <div className="text-sm font-medium text-gray-700 flex items-center justify-center">
              <Calendar className="mr-1 h-4 w-4" />
              {new Date(overview.last_active).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-600">Last Active</div>
          </div>:null}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
