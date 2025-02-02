import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationStats } from "@/types/adminTypes";

interface Props {
  invitations: InvitationStats;
}

const InvitationStatsCard: React.FC<Props> = ({ invitations }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Total Invitations: {invitations.totalInvitations}</p>
        <p>Used Invitations: {invitations.usedInvitations}</p>
        <p>Pending Invitations: {invitations.pendingInvitations}</p>
      </CardContent>
    </Card>
  );
};

export default InvitationStatsCard;
