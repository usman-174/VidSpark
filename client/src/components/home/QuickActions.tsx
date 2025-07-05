import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Zap, Type, MessageSquare, Search, Package, User } from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      title: "Generate Titles",
      description: "Create engaging video titles",
      icon: Type,
      href: "/title-generation",
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "Popular"
    },
    {
      title: "Sentiment Analysis",
      description: "Analyze video sentiment",
      icon: MessageSquare,
      href: "/sentimental-analysis",
      color: "bg-green-500 hover:bg-green-600",
      badge: null
    },
    {
      title: "Keyword Analysis",
      description: "Extract trending keywords",
      icon: Search,
      href: "/keyword-analysis",
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "New"
    },
    {
      title: "View Packages",
      description: "Explore subscription plans",
      icon: Package,
      href: "/packages",
      color: "bg-orange-500 hover:bg-orange-600",
      badge: null
    },
    {
      title: "Your Profile",
      description: "Manage your account",
      icon: User,
      href: "/profile",
      color: "bg-gray-500 hover:bg-gray-600",
      badge: null
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Zap className="mr-2 h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              asChild
              variant="outline"
              className={`h-auto p-3 flex flex-col items-center space-y-2 hover:shadow-md transition-all relative ${action.color} text-white border-none`}
            >
              <Link to={action.href}>
                {action.badge && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 right-1 bg-white text-gray-800 text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
                <action.icon className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold text-xs">{action.title}</div>
                  <div className="text-xs opacity-90 hidden md:block">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;