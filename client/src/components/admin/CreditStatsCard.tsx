import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditStats } from "@/types/adminTypes";

interface Props {
  credits: CreditStats;
}

const CreditStatsCard: React.FC<Props> = ({ credits }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Total Credits Given: {credits.totalCreditsGiven}</p>
        {credits.policyStats.map((policy, index) => (
          <p key={index}>{policy.type}: {policy.credits} credits</p>
        ))}
      </CardContent>
    </Card>
  );
};

export default CreditStatsCard;
