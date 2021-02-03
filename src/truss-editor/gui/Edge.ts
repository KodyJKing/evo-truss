import { pointLineDistance, removeFromArray } from "../../util"
import Vector2 from "../../Vector2"
import Vertex from "./Vertex"
import App from "../App"
import { GuiElement, emptySnaplines } from "./GuiElement"
import SnapLine from "../SnapLine"
import { matrix } from "mathjs"
import { textbox } from "../drawutil"


export default class Edge extends GuiElement {
    a: Vertex
    b: Vertex
    tension: number | null = null

    constructor( a: Vertex, b: Vertex ) {
        super()
        this.a = a
        this.b = b
    }

    distance( app: App, point: Vector2 ) {
        return pointLineDistance( point, this.a.position, this.b.position )
    }

    draw( app: App ) {
        let { c } = app, { a, b } = this, aPos = a.position, bPos = b.position
        let color = this.color( app )
        c.save(); {
            c.strokeStyle = color
            c.fillStyle = color
            c.lineWidth = 4
            c.beginPath()
            c.moveTo( aPos.x, aPos.y )
            c.lineTo( bPos.x, bPos.y )
            c.stroke()
            if ( this.tension !== null ) {
                let midpoint = aPos.add( bPos ).multiply( .5 )
                textbox( c, midpoint, this.tension.toFixed( 2 ) )
            }
        }; c.restore()
    }

    remove( app: App ) {
        removeFromArray( this, app.edges )
    }

    // drag( app: App, position: Vector2 ) {
    //     let a = this.a.position, b = this.b.position
    //     let heading = b.subtract( a ).unit()
    //     let right = heading.rightNormal()
    //     let displacement = ( position.subtract( a ) ).dot( right )
    //     let displacementVector = right.multiply( displacement )
    //     this.a.position = a.add( displacementVector )
    //     this.b.position = b.add( displacementVector )
    // }

    snaplines( app: App ): SnapLine[] {
        if ( app.dragElement == this.a || app.dragElement == this.b )
            return emptySnaplines
        return [
            new SnapLine( this.a.position, this.a.position.subtract( this.b.position ) )
        ]
    }
}
