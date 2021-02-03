import Vector2 from "../../Vector2"
import App from "../App"
import SnapLine from "../SnapLine"

export const emptySnaplines = [] as SnapLine[]
Object.freeze( emptySnaplines )

export class GuiElement {
    distance( app: App, point: Vector2 ): number { return -1 }
    draw( app: App ): void { }
    mousedown( app: App ): void { }
    keypress( app: App, event: KeyboardEvent ): void { }
    drag( app: App, position: Vector2 ) { }
    remove( app: App ): void { }
    color( app: App ) {
        if ( this == app.selectedElement )
            return "blue"
        else if ( this == app.focusElement )
            return "red"
        return "black"
    }
    snaplines( app: App ): SnapLine[] { return emptySnaplines }
}
