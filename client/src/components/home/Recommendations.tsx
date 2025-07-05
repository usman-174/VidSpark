import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserRecommendations } from "@/api/userInsightsApi";
import { Lightbulb, Star, TrendingUp, CheckCircle } from "lucide-react";

interface RecommendationsProps {
  recommendations: UserRecommendations | null;
  isLoading: boolean;
}

const RecommendationCard = ({ 
  title, 
  items, 
  icon: Icon, 
  color, 
  bgColor 
}: { 
  title: string;
  items: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) => (
  <Card className={`${bgColor} border-none`}>
    <CardHeader className="pb-3">
      <CardTitle className={`text-lg flex items-center ${color}`}>
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-white bg-opacity-50">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No recommendations available</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const Recommendations = ({ recommendations, isLoading }: RecommendationsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!recommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No recommendations available at the moment.</p>
            <p className="text-sm mt-2">Use more features to get personalized suggestions!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Personalized for You</h2>
        <p className="text-gray-600">AI-powered recommendations based on your usage patterns</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecommendationCard
          title="Feature Suggestions"
          items={recommendations.feature_suggestions}
          icon={Star}
          color="text-blue-700"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        
        <RecommendationCard
          title="Content Tips"
          items={recommendations.content_tips}
          icon={Lightbulb}
          color="text-yellow-700"
          bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100"
        />
        
        <RecommendationCard
          title="Optimization Tips"
          items={recommendations.optimization_tips}
          icon={TrendingUp}
          color="text-green-700"
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
      </div>
    </div>
  );
};

export default Recommendations;