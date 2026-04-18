import { prisma } from "../../src/client"

const plants = [
  { key: "plant-main", name: "Plant Main" },
  { key: "plant-east", name: "Plant East" },
] as const

const businessUnits = [
  { key: "bu-auto", name: "BU Automotive", plantKey: "plant-main" },
  { key: "bu-elec", name: "BU Electronics", plantKey: "plant-main" },
  { key: "bu-energy", name: "BU Energy", plantKey: "plant-east" },
] as const

const orgFunctions = [
  { key: "fn-prod", name: "Production", businessUnitKey: "bu-auto" },
  { key: "fn-quality", name: "Quality", businessUnitKey: "bu-auto" },
  { key: "fn-supply", name: "Supply Chain", businessUnitKey: "bu-elec" },
  { key: "fn-engineering", name: "Engineering", businessUnitKey: "bu-energy" },
] as const

const divisions = [
  { key: "div-assembly", name: "Assembly", functionKey: "fn-prod" },
  { key: "div-paint", name: "Paint", functionKey: "fn-prod" },
  { key: "div-qc", name: "Quality Control", functionKey: "fn-quality" },
  { key: "div-logistics", name: "Logistics", functionKey: "fn-supply" },
  { key: "div-rnd", name: "R&D", functionKey: "fn-engineering" },
] as const

const departments = [
  { key: "dep-assy-a", name: "Assembly Line A", divisionKey: "div-assembly" },
  { key: "dep-assy-b", name: "Assembly Line B", divisionKey: "div-assembly" },
  { key: "dep-paint", name: "Paint Operations", divisionKey: "div-paint" },
  { key: "dep-qc-in", name: "Incoming Quality", divisionKey: "div-qc" },
  {
    key: "dep-log-plan",
    name: "Transport Planning",
    divisionKey: "div-logistics",
  },
  { key: "dep-rnd-lab", name: "Prototype Lab", divisionKey: "div-rnd" },
] as const

export async function seedOrganizationUnits() {
  console.log("🌱 Seeding organization units...")

  const plantIdByKey = new Map<string, string>()
  const businessUnitIdByKey = new Map<string, string>()
  const functionIdByKey = new Map<string, string>()
  const divisionIdByKey = new Map<string, string>()

  for (const plant of plants) {
    const created = await prisma.plant.create({
      data: {
        name: plant.name,
      },
      select: { id: true },
    })

    plantIdByKey.set(plant.key, created.id)
  }

  for (const businessUnit of businessUnits) {
    const plantId = plantIdByKey.get(businessUnit.plantKey)

    if (!plantId) {
      throw new Error(
        `Plant key not found while seeding business unit: ${businessUnit.plantKey}`
      )
    }

    const created = await prisma.businessUnit.create({
      data: {
        name: businessUnit.name,
        plantId,
      },
      select: { id: true },
    })

    businessUnitIdByKey.set(businessUnit.key, created.id)
  }

  for (const orgFunction of orgFunctions) {
    const businessUnitId = businessUnitIdByKey.get(orgFunction.businessUnitKey)

    if (!businessUnitId) {
      throw new Error(
        `Business unit key not found while seeding function: ${orgFunction.businessUnitKey}`
      )
    }

    const created = await prisma.orgFunction.create({
      data: {
        name: orgFunction.name,
        businessUnitId,
      },
      select: { id: true },
    })

    functionIdByKey.set(orgFunction.key, created.id)
  }

  for (const division of divisions) {
    const functionId = functionIdByKey.get(division.functionKey)

    if (!functionId) {
      throw new Error(
        `Function key not found while seeding division: ${division.functionKey}`
      )
    }

    const created = await prisma.division.create({
      data: {
        name: division.name,
        functionId,
      },
      select: { id: true },
    })

    divisionIdByKey.set(division.key, created.id)
  }

  for (const department of departments) {
    const divisionId = divisionIdByKey.get(department.divisionKey)

    if (!divisionId) {
      throw new Error(
        `Division key not found while seeding department: ${department.divisionKey}`
      )
    }

    await prisma.department.create({
      data: {
        name: department.name,
        divisionId,
      },
    })
  }

  console.log(
    `✅ Seeded ${plants.length} plants, ${businessUnits.length} business units, ${orgFunctions.length} functions, ${divisions.length} divisions, ${departments.length} departments`
  )
}

if (require.main === module) {
  seedOrganizationUnits()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
