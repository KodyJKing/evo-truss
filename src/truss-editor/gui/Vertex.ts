import { notDependencies } from "mathjs"
import { removeFromArray } from "../../util"
import Vector2 from "../../Vector2"
import App from "../App"
import Edge from "./Edge"
import { emptySnaplines, GuiElement } from "./GuiElement"
import SnapLine from "../SnapLine"

enum Constraint { None, Pin, HorizontalRoller, VerticalRoller }

export default class Vertex extends GuiElement {
    position: Vector2
    constraint: Constraint = Constraint.None
    constructor( position ) {
        super()
        this.position = position
    }

    distance( app: App, point: Vector2 ) {
        return this.position.subtract( point ).length
    }

    draw( app: App ) {
        let { c } = app
        let { constraint: constraint } = this
        let { x, y } = this.position
        let color = this.color( app )

        c.save(); {
            c.translate( x, y )

            const radius = 5
            c.strokeStyle = color
            c.fillStyle = color

            c.beginPath()
            c.arc( 0, 0, radius, 0, Math.PI * 2 )
            c.stroke()
            c.fill()

            const constraintRadius = radius + 4
            switch ( constraint ) {
                case Constraint.Pin:
                    this.drawPin( app, constraintRadius, 0 )
                    this.drawPin( app, constraintRadius, Math.PI / 2 )
                    break
                case Constraint.HorizontalRoller:
                    this.drawPin( app, constraintRadius, 0 )
                    break
                case Constraint.VerticalRoller:
                    this.drawPin( app, constraintRadius, Math.PI / 2 )
                    break
                default:
                    break
            }
        }; c.restore()

    }

    private drawPin( app: App, radius, angle ) {
        let { c } = app
        c.rotate( angle )
        c.beginPath()
        c.moveTo( -radius, -radius )
        c.lineTo( radius, -radius )
        c.moveTo( -radius, radius )
        c.lineTo( radius, radius )
        c.stroke()
    }

    mousedown( app: App ) {
        let { selectedElement } = app
        if ( selectedElement == null ) {
            app.selectedElement = this
        } else if ( selectedElement instanceof Vertex ) {
            if ( selectedElement != this )
                app.edges.push( new Edge( selectedElement, this ) )
            app.selectedElement = null
        }
    }

    keypress( app: App, event: KeyboardEvent ) {
        if ( event.key.toLocaleLowerCase() == "c" ) {
            this.constraint = ( this.constraint + 1 ) % 4
        }
    }

    drag( app: App, position: Vector2 ) {
        this.position = position
    }

    remove( app: App ) {
        removeFromArray( this, app.vertices )
        app.edges = app.edges.filter( edge => edge.a != this && edge.b != this )
        app.loads = app.loads.filter( load => load.vertex != this )
    }

    reactions(): Vector2[] {
        switch ( this.constraint ) {
            case Constraint.Pin:
                return [ new Vector2( 1, 0 ), new Vector2( 0, 1 ) ]
            case Constraint.HorizontalRoller:
                return [ new Vector2( 0, 1 ) ]
            case Constraint.VerticalRoller:
                return [ new Vector2( 1, 0 ) ]
            default:
                return []
        }
    }

    snaplines( app: App ): SnapLine[] {
        if ( app.dragElement == this ) return emptySnaplines
        return [
            new SnapLine( this.position, new Vector2( 1, 0 ) ),
            new SnapLine( this.position, new Vector2( 0, 1 ) ),
        ]
    }
}
