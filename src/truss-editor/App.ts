import Mouse from "./input/Mouse"
import Vertex from "./gui/Vertex"
import Edge from "./gui/Edge"
import { GuiElement } from "./gui/GuiElement"
import Keyboard from "./input/Keyboard"
import Load from "./gui/Load"
import Vector2 from "../Vector2"
import { solveTruss, TrussEdge, TrussLoad, TrussReaction } from "../truss"
import SnapLine from "./SnapLine"
import { findMin } from "../util"

export default class App {
    canvas: HTMLCanvasElement
    c: CanvasRenderingContext2D
    mouse: Mouse
    keyboard: Keyboard = new Keyboard()

    vertices: Vertex[] = []
    edges: Edge[] = []
    loads: Load[] = []

    maxForce: number | null = null

    focusElement: GuiElement | null = null
    selectedElement: GuiElement | null = null
    dragElement: GuiElement | null = null

    showRelativeGuides = false
    showGrid = true
    gridStride = 40

    static maxSelectDistance = 20
    static snapDistance = 10

    constructor() {
        this.canvas = document.getElementById( "canvas" ) as HTMLCanvasElement
        this.c = this.canvas.getContext( "2d" ) as CanvasRenderingContext2D
        this.mouse = new Mouse( this.canvas )
        this.resizeCanvas( window.innerHeight - 10, window.innerWidth - 25, 1 )
        this.canvas.addEventListener( "mousedown", ev => this.mousedown( ev ) )
        window.addEventListener( "keypress", ev => this.keypress( ev ) )
        this.mainLoop()
    }

    *elements() {
        for ( let elements of [ this.vertices, this.edges, this.loads ] )
            yield* elements
    }

    resizeCanvas( height, width, pixelDensity ) {
        this.canvas.style.width = width + "px"
        this.canvas.style.height = height + "px"
        this.canvas.width = width * pixelDensity
        this.canvas.height = height * pixelDensity
        this.canvas.getContext( "2d" )?.scale( pixelDensity, pixelDensity )
    }

    mainLoop() {
        this.update()
        requestAnimationFrame( () => this.mainLoop() )
    }

    update() {
        let { c, canvas } = this, { width, height } = canvas
        c.clearRect( 0, 0, width, height )


        let snaplines = Array.from(
            SnapLine.distinct(
                this.snaplines()
            )
        )
        for ( let snapline of snaplines )
            snapline.draw( this, this.mouse.pos )
        this.updateDrag( snaplines )

        this.focusElement = this.pickFocus()
        for ( let elements of [ this.loads, this.edges, this.vertices ] )
            for ( let element of elements )
                element.draw( this )
        this.focusElement?.draw( this )

        this.solve()

        if ( this.maxForce == null ) {
            c.font = "12px Arial"
            c.fillText( "system is unsolvable", 5, 12 )
        }
    }

    updateDrag( snaplines: SnapLine[] ) {
        if ( !this.mouse.leftDown )
            this.dragElement = null
        if ( this.dragElement != null ) {
            let dragPosition = this.pickSnapPoint( snaplines, this.mouse.pos )
            this.dragElement.drag( this, dragPosition )
        }
    }

    *snaplines() {
        if ( this.showRelativeGuides )
            for ( let elements of [ this.vertices, this.edges, this.loads ] )
                for ( let element of elements )
                    yield* element.snaplines( this )
        if ( this.showGrid ) {
            const stride = this.gridStride
            for ( let x = 0; x < this.canvas.width; x += stride )
                yield new SnapLine( new Vector2( x, 0 ), new Vector2( 0, 1 ) )
            for ( let y = 0; y < this.canvas.height; y += stride )
                yield new SnapLine( new Vector2( 0, y ), new Vector2( 1, 0 ) )
        }
    }

    pickSnapPoint( snaplines: SnapLine[], mousePos: Vector2 ) {
        let intersections = SnapLine.intersections( snaplines )

        let minIntersection = findMin( intersections, ( point: Vector2 ) => {
            let distance = point.distance( mousePos )
            return distance > App.snapDistance ? Infinity : distance
        } )

        if ( minIntersection != undefined ) {
            return minIntersection
        } else {
            let minSnapLine = findMin( snaplines, line => {
                let distance = line.distance( mousePos )
                return distance > App.snapDistance ? Infinity : distance
            } )

            if ( minSnapLine != undefined )
                return minSnapLine.snappoint( mousePos )
            return mousePos
        }

    }

    mousedown( event ) {
        let { mouse, keyboard, focusElement, selectedElement } = this
        if ( event.button == 0 ) {
            if ( focusElement != null ) {
                if ( keyboard.get( "shift" ) )
                    this.dragElement = focusElement
                else
                    focusElement.mousedown( this )
            } else {
                if ( selectedElement instanceof Vertex && keyboard.get( "shift" ) ) {
                    this.loads.push( new Load( selectedElement, mouse.pos ) )
                    this.selectedElement = null
                } else {
                    let vertex = new Vertex( mouse.pos )
                    this.vertices.push( vertex )
                    if ( this.selectedElement != null )
                        vertex.mousedown( this )
                }
            }
        } else {
            this.selectedElement = null
            if ( focusElement != null )
                focusElement.remove( this )
        }
    }

    keypress( event: KeyboardEvent ) {
        if ( event.key == "r" )
            this.showRelativeGuides = !this.showRelativeGuides
        if ( event.key == "g" )
            this.showGrid = !this.showGrid
        if ( event.key == "-" )
            this.gridStride *= 2
        if ( event.key == "=" ) {
            this.gridStride /= 2
            this.gridStride = Math.max( 10, this.gridStride )
        }
        this.focusElement?.keypress( this, event )
    }

    pickFocus(): GuiElement | null {
        let best: GuiElement | null = null, bestDist = Infinity
        let mousePos = this.mouse.pos

        let pickFrom = ( elements: GuiElement[] ) => {
            for ( let element of elements ) {
                let dist = element.distance( this, mousePos )
                if ( dist > App.maxSelectDistance )
                    continue
                if ( dist < bestDist ) {
                    best = element
                    bestDist = dist
                }
            }
        }

        pickFrom( this.vertices )
        if ( best == null )
            pickFrom( this.loads )
        if ( best == null )
            pickFrom( this.edges )

        return best
    }

    private solve() {
        let vertexNumbers = new Map<Vertex, number>()
        let vertexNum = 0
        let vertices: Vector2[] = []
        let reactions: TrussReaction[] = []
        for ( let vertex of this.vertices ) {
            for ( let reactionForce of vertex.reactions() )
                reactions.push( [ vertexNum, reactionForce ] )
            vertices.push( vertex.position )
            vertexNumbers.set( vertex, vertexNum )
            vertexNum++
        }

        let edges: TrussEdge[] = []
        for ( let edge of this.edges ) {
            let i = vertexNumbers.get( edge.a ), j = vertexNumbers.get( edge.b )
            if ( i == undefined || j == undefined )
                throw new Error( "Missing vertex." )
            edges.push( [ i, j ] )
        }

        let loads: TrussLoad[] = []
        for ( let load of this.loads ) {
            let i = vertexNumbers.get( load.vertex )
            let force = load.force()
            if ( i == undefined ) throw new Error( "Missing vertex." )
            loads.push( [ i, force ] )
        }

        let problem = { vertices, reactions, edges, loads }
        for ( let vertex of this.vertices ) vertex.reaction = null
        try {
            let solution = solveTruss( problem )
            this.maxForce = 0
            for ( let i = 0; i < this.edges.length; i++ ) {
                let tension = solution[ i ][ 0 ]
                this.edges[ i ].tension = tension
                this.maxForce = Math.max( this.maxForce ?? 0, Math.abs( tension ) )
            }
            for ( let i = 0; i < reactions.length; i++ ) {
                let j = reactions[ i ][ 0 ]
                let k = edges.length + i
                let scalarForce = solution[ k ][ 0 ]
                let force = reactions[ i ][ 1 ].multiply( scalarForce )
                let vertex = this.vertices[ j ]
                vertex.reaction = ( vertex.reaction ?? new Vector2( 0, 0 ) ).add( force )
            }
        } catch ( e ) {
            this.maxForce = null
            for ( let i = 0; i < this.edges.length; i++ )
                this.edges[ i ].tension = null
        }
    }
}
