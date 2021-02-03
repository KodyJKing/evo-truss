import { pointLineDistance, removeFromArray } from "../../util"
import Vector2 from "../../Vector2"
import App from "../App"
import { GuiElement, emptySnaplines } from "./GuiElement"
import VCanvas from "../VCanvas"
import Vertex from "./Vertex"
import SnapLine from "../SnapLine"
import { textbox } from "../drawutil"

export default class Load extends GuiElement {
    vertex: Vertex
    head: Vector2
    constructor( vertex: Vertex, head: Vector2 ) {
        super()
        this.vertex = vertex
        this.head = head
    }

    tail() {
        return this.vertex.position
    }

    force() {
        return this.head.subtract( this.tail() )
    }

    draw( app: App ) {
        let { c } = app
        let { head } = this
        let tail = this.tail()
        let displacement = head.subtract( tail )
        let forward = displacement.unit()
        let right = forward.rightNormal()
        c.save(); {
            c.strokeStyle = this.color( app )
            c.lineWidth = 3
            c.beginPath()
            c.lineJoin = "round"
            c.lineCap = "round"
            VCanvas.path(
                c,
                [ tail, head ],
                [
                    head.subtract( forward.multiply( 10 ) ).add( right.multiply( 5 ) ),
                    head,
                    head.subtract( forward.multiply( 10 ) ).add( right.multiply( -5 ) )
                ]
            )
            c.stroke()

            let midpoint = head.add( tail ).multiply( .5 )
            let force = displacement.length
            textbox( c, midpoint, force.toFixed( 2 ) )
        }; c.restore()
    }

    distance( app: App, point: Vector2 ) {
        return pointLineDistance( point, this.tail(), this.head )
    }

    drag( app: App, position: Vector2 ) {
        this.head = position
    }

    remove( app: App ) {
        removeFromArray( this, app.loads )
    }

    snaplines( app: App ): SnapLine[] {
        if ( app.dragElement == this || app.dragElement == this.vertex )
            return emptySnaplines
        return [
            new SnapLine( this.head, this.force() )
        ]
    }
}