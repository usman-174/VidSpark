const { PrismaClient } = require("@prisma/client");

const fs = require("fs");

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log("Reading exported data...");

    // Read the JSON file
    const rawData = fs.readFileSync("exportedData.json");
    const data = JSON.parse(rawData);

    console.log("Inserting data into the new database...");

    // Insert policies first (to maintain foreign key integrity)
    for (const policy of data.policies) {
      await prisma.policy.create({
        data: policy,
      });
    }

    // Insert categories
    for (const category of data.categories) {
      await prisma.category.create({
        data: category,
      });
    }

    // Insert users
    for (const user of data.users) {
      await prisma.user.create({
        data: {
          ...user,
          children: undefined, // Exclude children for now to avoid circular dependencies
          credits: undefined,
          sentInvitations: undefined,
        },
      });
    }

    // Insert credits
    for (const credit of data.credits) {
      await prisma.credit.create({
        data: credit,
      });
    }

    // Insert invitations
    for (const invitation of data.invitations) {
      await prisma.invitation.create({
        data: invitation,
      });
    }

    console.log("Data successfully imported into the new database.");
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
