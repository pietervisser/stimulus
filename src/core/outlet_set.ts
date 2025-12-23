import { Scope } from "./scope"
import { OutletDefinition } from "./outlet_definition"
import { readInheritableStaticArrayValues } from "./inheritable_statics"

export class OutletSet {
  readonly scope: Scope
  readonly controllerElement: Element
  private outletDefinitionsByName = new Map<string, OutletDefinition>()

  constructor(scope: Scope, controllerElement: Element) {
    this.scope = scope
    this.controllerElement = controllerElement
  }

  setOutletDefinitionsFromConstructor(constructor: any) {
    const outletDefinitions = readInheritableStaticArrayValues(constructor, "outlets")
    outletDefinitions.forEach((outletDefinitionString: string) => {
      const outletDefinition = new OutletDefinition(outletDefinitionString)
      this.outletDefinitionsByName.set(outletDefinition.name, outletDefinition)
    })
  }

  get element() {
    return this.scope.element
  }

  get identifier() {
    return this.scope.identifier
  }

  get schema() {
    return this.scope.schema
  }

  has(outletName: string) {
    return this.find(outletName) != null
  }

  find(...outletNames: string[]) {
    return outletNames.reduce(
      (outlet, outletName) => outlet || this.findOutlet(outletName),
      undefined as Element | undefined
    )
  }

  findAll(...outletNames: string[]) {
    return outletNames.reduce(
      (outlets, outletName) => [...outlets, ...this.findAllOutlets(outletName)],
      [] as Element[]
    )
  }

  getSelectorForOutletName(outletName: string) {
    const attributeName = this.schema.outletAttributeForScope(this.identifier, outletName)
    return this.controllerElement.getAttribute(attributeName)
  }

  getIdentifierForOutletName(outletName: string): string {
    const outletDefinition = this.outletDefinitionsByName.get(outletName)
    return outletDefinition ? outletDefinition.identifier : outletName
  }

  private findOutlet(outletName: string) {
    const selector = this.getSelectorForOutletName(outletName)
    const identifier = this.getIdentifierForOutletName(outletName)
    if (selector) return this.findElement(selector, identifier)
  }

  private findAllOutlets(outletName: string) {
    const selector = this.getSelectorForOutletName(outletName)
    const identifier = this.getIdentifierForOutletName(outletName)
    return selector ? this.findAllElements(selector, identifier) : []
  }

  private findElement(selector: string, identifier: string): Element | undefined {
    const elements = this.scope.queryElements(selector)
    return elements.filter((element) => this.matchesElement(element, selector, identifier))[0]
  }

  private findAllElements(selector: string, identifier: string): Element[] {
    const elements = this.scope.queryElements(selector)
    return elements.filter((element) => this.matchesElement(element, selector, identifier))
  }

  private matchesElement(element: Element, selector: string, identifier: string): boolean {
    const controllerAttribute = element.getAttribute(this.scope.schema.controllerAttribute) || ""
    return element.matches(selector) && controllerAttribute.split(" ").includes(identifier)
  }
}
