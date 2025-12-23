export class OutletDefinition {
  readonly name: string
  readonly identifier: string

  constructor(definition: string) {
    if (definition.includes("@")) {
      const parts = definition.split("@", 2)
      this.name = parts[0]
      this.identifier = parts[1]
    } else {
      this.name = definition
      this.identifier = definition
    }
  }
}
