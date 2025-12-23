import { Constructor } from "./constructor"
import { Controller } from "./controller"
import { readInheritableStaticArrayValues } from "./inheritable_statics"
import { capitalize, namespaceCamelize } from "./string_helpers"
import { OutletDefinition } from "./outlet_definition"

export function OutletPropertiesBlessing<T>(constructor: Constructor<T>) {
  const outlets = readInheritableStaticArrayValues(constructor, "outlets")
  return outlets.reduce((properties: any, outletDefinition: any) => {
    return Object.assign(properties, propertiesForOutletDefinition(outletDefinition))
  }, {} as PropertyDescriptorMap)
}

function getOutletController(controller: Controller, element: Element, identifier: string) {
  return controller.application.getControllerForElementAndIdentifier(element, identifier)
}

function getControllerAndEnsureConnectedScope(controller: Controller, element: Element, identifier: string) {
  let outletController = getOutletController(controller, element, identifier)
  if (outletController) return outletController

  controller.application.router.proposeToConnectScopeForElementAndIdentifier(element, identifier)

  outletController = getOutletController(controller, element, identifier)
  if (outletController) return outletController
}

function propertiesForOutletDefinition(outletDefinitionString: string) {
  const outletDefinition = new OutletDefinition(outletDefinitionString)
  const camelizedName = namespaceCamelize(outletDefinition.name)

  return {
    [`${camelizedName}Outlet`]: {
      get(this: Controller) {
        const outletElement = this.outlets.find(outletDefinition.name)
        const selector = this.outlets.getSelectorForOutletName(outletDefinition.name)

        if (outletElement) {
          const outletController = getControllerAndEnsureConnectedScope(this, outletElement, outletDefinition.identifier)

          if (outletController) return outletController

          throw new Error(
            `The provided outlet element is missing an outlet controller "${outletDefinition.name}" instance for host controller "${this.identifier}"`
          )
        }

        throw new Error(
          `Missing outlet element "${outletDefinition.name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`
        )
      },
    },

    [`${camelizedName}Outlets`]: {
      get(this: Controller) {
        const outlets = this.outlets.findAll(outletDefinition.name)

        if (outlets.length > 0) {
          return outlets
            .map((outletElement: Element) => {
              const outletController = getControllerAndEnsureConnectedScope(this, outletElement, outletDefinition.identifier)

              if (outletController) return outletController

              console.warn(
                `The provided outlet element is missing an outlet controller "${outletDefinition.name}" instance for host controller "${this.identifier}"`,
                outletElement
              )
            })
            .filter((controller) => controller) as Controller[]
        }

        return []
      },
    },

    [`${camelizedName}OutletElement`]: {
      get(this: Controller) {
        const outletElement = this.outlets.find(outletDefinition.name)
        const selector = this.outlets.getSelectorForOutletName(outletDefinition.name)

        if (outletElement) {
          return outletElement
        } else {
          throw new Error(
            `Missing outlet element "${outletDefinition.name}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`
          )
        }
      },
    },

    [`${camelizedName}OutletElements`]: {
      get(this: Controller) {
        return this.outlets.findAll(outletDefinition.name)
      },
    },

    [`has${capitalize(camelizedName)}Outlet`]: {
      get(this: Controller) {
        return this.outlets.has(outletDefinition.name)
      },
    },
  }
}
