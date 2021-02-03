import { pointLineDistance } from "../util"
import Vector2 from "../Vector2"
import App from "./App"
import VCanvas from "./VCanvas"

export default class SnapLine {
    origin: Vector2
    heading: Vector2
    constructor( origin: Vector2, heading: Vector2 ) {
        this.origin = origin
        this.heading = heading.unit()
    }

    draw( app: App, mousePos: Vector2 ) {
        let { c } = app
        let { origin, heading } = this
        let mx = mousePos.x, my = mousePos.y
        let start = origin.subtract( heading.multiply( 2000 ) ), end = origin.add( heading.multiply( 2000 ) )
        let gradient = c.createRadialGradient( mx, my, 100, mx, my, 400 )
        gradient.addColorStop( 0, "gray" )
        gradient.addColorStop( 1, "#f8f8ff" )
        c.save(); {
            c.strokeStyle = gradient
            c.beginPath()
            VCanvas.path( c, [ start, end ] )
            c.setLineDash( [ 10, 2 ] )
            c.stroke()
            c.setLineDash( [] )
            c.restore()
        }; c.restore()
    }

    distance( point: Vector2 ) {
        let { origin, heading } = this
        let diff = point.subtract( origin )
        return Math.abs( heading.cross( diff ) )
    }

    snappoint( point: Vector2 ) {
        let { origin, heading } = this
        let diff = point.subtract( origin )
        return diff.projection( heading ).add( origin )
    }

    intersection( other: SnapLine ) {
        let diff = other.origin.subtract( this.origin )
        let normal = other.heading.unit().leftNormal()
        let rateAlongNormal = this.heading.dot( normal )
        let distAlongNormal = diff.dot( normal )
        let deltaTime = distAlongNormal / rateAlongNormal
        if ( rateAlongNormal == 0 )
            return null
        return this.origin.add( this.heading.multiply( deltaTime ) )
    }

    static intersections( snaplines: SnapLine[] ) {
        let result = [] as Vector2[]
        const count = snaplines.length
        for ( let i = 0; i < count; i++ ) {
            let snaplineI = snaplines[ i ]
            for ( let j = i + 1; j < count; j++ ) {
                let point = snaplineI.intersection( snaplines[ j ] )
                if ( point ) result.push( point )
            }
        }
        return result
    }

    static *distinct( snaplines: Iterable<SnapLine> ) {
        let visited = new Set<string>()
        for ( let line of snaplines ) {
            let radius = Math.abs( line.origin.cross( line.heading ) ).toFixed( 2 )
            let x = line.heading.x.toFixed( 2 )
            let y = line.heading.x.toFixed( 2 )
            let key = [ radius, x, y ].join( "," )
            if ( visited.has( key ) ) continue
            visited.add( key )
            yield line
        }
    }
}