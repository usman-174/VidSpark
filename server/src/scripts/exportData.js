const { PrismaClient } = require('@prisma/client');

const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Fetching data from the database...');

    // Fetch all data while excluding the specific user
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: 'test@test11.com',
        },
      },
      include: {
        children: true,
        credits: true,
        sentInvitations: true,
      },
    });

    const invitations = await prisma.invitation.findMany();
    const credits = await prisma.credit.findMany();
    const policies = await prisma.policy.findMany();
    const categories = await prisma.category.findMany();

    const data = {
      users,
      invitations,
      credits,
      policies,
      categories,
    };

    // Save to JSON file
    fs.writeFileSync('exportedData.json', JSON.stringify(data, null, 2));

    console.log('Data successfully exported to exportedData.json');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
