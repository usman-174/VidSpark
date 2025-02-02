import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats } from "@/types/adminTypes";

interface Props {
  stats: UserStats;
}

const UserStatsCards: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.activeUsers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Users Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.newUsersToday}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatsCards;