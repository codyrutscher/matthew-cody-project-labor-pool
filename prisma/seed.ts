import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addWeeks, startOfWeek } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Create cuisine types
  const cuisines = await Promise.all([
    prisma.cuisineType.upsert({
      where: { name: "Italian" },
      update: {},
      create: { name: "Italian", description: "Classic Italian dishes" },
    }),
    prisma.cuisineType.upsert({
      where: { name: "Mexican" },
      update: {},
      create: { name: "Mexican", description: "Authentic Mexican cuisine" },
    }),
    prisma.cuisineType.upsert({
      where: { name: "Japanese" },
      update: {},
      create: { name: "Japanese", description: "Traditional Japanese food" },
    }),
    prisma.cuisineType.upsert({
      where: { name: "Indian" },
      update: {},
      create: { name: "Indian", description: "Flavorful Indian dishes" },
    }),
    prisma.cuisineType.upsert({
      where: { name: "Mediterranean" },
      update: {},
      create: { name: "Mediterranean", description: "Fresh Mediterranean flavors" },
    }),
  ]);

  // Create sample menus for next 4 weeks
  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

  for (let i = 0; i < 4; i++) {
    const weekOf = addWeeks(thisWeek, i);
    const cuisine = cuisines[i % cuisines.length];

    const menu = await prisma.menu.upsert({
      where: { weekOf_cuisineTypeId: { weekOf, cuisineTypeId: cuisine.id } },
      update: {},
      create: {
        weekOf,
        cuisineTypeId: cuisine.id,
        publishedAt: new Date(),
      },
    });

    // Add menu items based on cuisine
    const menuItems = getMenuItems(cuisine.name);
    for (const item of menuItems) {
      await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          ...item,
        },
      });
    }
  }

  // Create demo office and user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const office = await prisma.office.upsert({
    where: { id: "demo-office" },
    update: {},
    create: {
      id: "demo-office",
      name: "Demo Company",
      address: "123 Main St, San Francisco, CA",
      budgetLimit: 500,
      cateringMaterials: "Disposable plates, napkins, utensils",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo Manager",
      password: hashedPassword,
      role: "MANAGER",
      officeId: office.id,
    },
  });

  await prisma.subscription.upsert({
    where: { officeId: office.id },
    update: {},
    create: {
      officeId: office.id,
      status: "ACTIVE",
      billingCycle: "weekly",
    },
  });

  console.log("Seed completed!");
}

function getMenuItems(cuisine: string) {
  const items: Record<string, Array<{ name: string; description: string; price: number; dietaryTags: string[] }>> = {
    Italian: [
      { name: "Margherita Pizza", description: "Fresh tomatoes, mozzarella, basil", price: 14.99, dietaryTags: ["Vegetarian"] },
      { name: "Chicken Parmesan", description: "Breaded chicken with marinara and cheese", price: 18.99, dietaryTags: [] },
      { name: "Caesar Salad", description: "Romaine, parmesan, croutons", price: 10.99, dietaryTags: ["Vegetarian"] },
      { name: "Pasta Primavera", description: "Seasonal vegetables in garlic olive oil", price: 15.99, dietaryTags: ["Vegetarian", "Vegan"] },
      { name: "Tiramisu", description: "Classic Italian dessert", price: 8.99, dietaryTags: ["Vegetarian"] },
    ],
    Mexican: [
      { name: "Chicken Tacos", description: "Grilled chicken, salsa, cilantro", price: 13.99, dietaryTags: [] },
      { name: "Veggie Burrito Bowl", description: "Rice, beans, guacamole, veggies", price: 14.99, dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"] },
      { name: "Carnitas Plate", description: "Slow-cooked pork with rice and beans", price: 17.99, dietaryTags: ["Gluten-Free"] },
      { name: "Chips & Guacamole", description: "Fresh made guacamole", price: 8.99, dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"] },
      { name: "Churros", description: "Cinnamon sugar with chocolate sauce", price: 6.99, dietaryTags: ["Vegetarian"] },
    ],
    Japanese: [
      { name: "Chicken Teriyaki", description: "Grilled chicken with teriyaki glaze", price: 16.99, dietaryTags: [] },
      { name: "Vegetable Sushi Roll", description: "Avocado, cucumber, carrot", price: 12.99, dietaryTags: ["Vegetarian", "Vegan"] },
      { name: "Miso Soup", description: "Traditional miso with tofu", price: 5.99, dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"] },
      { name: "Salmon Bento Box", description: "Grilled salmon with rice and sides", price: 19.99, dietaryTags: [] },
      { name: "Edamame", description: "Steamed soybeans with sea salt", price: 6.99, dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"] },
    ],
    Indian: [
      { name: "Butter Chicken", description: "Creamy tomato curry with chicken", price: 17.99, dietaryTags: ["Gluten-Free"] },
      { name: "Vegetable Biryani", description: "Fragrant rice with mixed vegetables", price: 14.99, dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"] },
      { name: "Samosas", description: "Crispy pastries with spiced potatoes", price: 7.99, dietaryTags: ["Vegetarian", "Vegan"] },
      { name: "Palak Paneer", description: "Spinach curry with cheese", price: 15.99, dietaryTags: ["Vegetarian", "Gluten-Free"] },
      { name: "Naan Bread", description: "Fresh baked flatbread", price: 3.99, dietaryTags: ["Vegetarian"] },
    ],
    Mediterranean: [
      { name: "Chicken Shawarma Plate", description: "Spiced chicken with hummus and pita", price: 16.99, dietaryTags: [] },
      { name: "Falafel Wrap", description: "Crispy falafel with tahini", price: 13.99, dietaryTags: ["Vegetarian", "Vegan"] },
      { name: "Greek Salad", description: "Tomatoes, cucumber, feta, olives", price: 11.99, dietaryTags: ["Vegetarian", "Gluten-Free"] },
      { name: "Hummus Platter", description: "Creamy hummus with pita and veggies", price: 9.99, dietaryTags: ["Vegetarian", "Vegan"] },
      { name: "Baklava", description: "Honey-soaked phyllo with nuts", price: 7.99, dietaryTags: ["Vegetarian"] },
    ],
  };

  return items[cuisine] || items.Italian;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
