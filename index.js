const express = require("express");
const prismaClient = require("@prisma/client");
const faker = require("@faker-js/faker");

const app = express();
const prisma = new prismaClient.PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/seed", async function (req, res) {
  try {
    await prisma.$connect();
    await prisma.user.deleteMany({});

    for (let i = 0; i < 1000; i++) {
      await prisma.user.create({
        data: {
          name: faker.faker.name.fullName(),
          email: faker.faker.internet.email(),
          address: faker.faker.address.streetAddress(),
        },
      });
    }

    res.status(201).json({
      message: "seeded.",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.post("/datatables/users", async function (req, res) {
  try {
    await prisma.$connect();

    const draw = Number(req.body.draw);
    const start = Number(req.body.start);
    const length = Number(req.body.length);
    const search = req.body["search[value]"];

    const where = {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };

    const [users, usersTotal, usersTotalFiltered] = await Promise.all([
      prisma.user.findMany({
        skip: start,
        take: length,
        where,
      }),
      prisma.user.count(),
      prisma.user.count({
        where,
      }),
    ]);

    res.status(200).json({
      draw,
      recordsTotal: usersTotal,
      recordsFiltered: usersTotalFiltered,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.listen(4444, function () {
  console.log("server started on port: 4444");
});
