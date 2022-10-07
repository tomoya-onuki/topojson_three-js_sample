import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

export class TopoJsonMap {
    private topoArcList: Vertex[][] = [];
    private topoGeometryList: any[] = [];
    public isDraw: boolean = false;
    private centerLat: number = 43.7
    private centerLon: number = 141
    private mapMesh: THREE.Mesh = new THREE.Mesh()

    constructor() {
    }

    public changeCenterPos(lat: number, lon: number) {
        this.centerLat = lat
        this.centerLon = lon
    }

    public read(jsonString: string): void {
        const topoJsonData = JSON.parse(jsonString);

        // topojsonのデータを緯度経度の絶対座標に変換する
        this.topoGeometryList = topoJsonData.objects.map.geometries;
        this.topoArcList = this.decodeArcs(topoJsonData, topoJsonData.arcs);
    }

    private decodeArc(topology: any, arc: number[][]): Vertex[] {
        let x = 0, y = 0;
        return arc.map((position) => {
            x += position[0];
            y += position[1];
            if (topology.transform != undefined) {
                const lon = x * topology.transform.scale[0] + topology.transform.translate[0];
                const lat = y * topology.transform.scale[1] + topology.transform.translate[1];
                return new Vertex(lon, lat);
            } else {
                const lon = x
                const lat = y
                return new Vertex(lon, lat);
            }

        });
    }

    private decodeArcs(topology: any, arcs: number[][][]): Vertex[][] {
        return arcs.map((arc) => this.decodeArc(topology, arc));
    }



    public draw(scene: THREE.Scene): void {
        const lon2x = (lon: number): number => {
            let centerLon: number = 0;
            // let centerLon: number = 140;
            let x: number = lon * (Math.PI / 180);
            let cx: number = centerLon * (Math.PI / 180);
            return (x - cx) * 100;
        }

        const alt2y = (alt: number): number => {
            // 高度データの単位はm
            return alt / 111000 * 100;
        }

        const lat2z = (lat: number): number => {
            let centerLat: number = 51.28;
            // let centerLat: number = 35.5;
            let y: number = Math.log(Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2));
            let cy: number = Math.log(Math.tan(Math.PI / 4 + centerLat * (Math.PI / 180) / 2));
            return (y - cy) * 100;
        }

        this.mapMesh.geometry.dispose();
        scene.remove(this.mapMesh);

        if (this.topoGeometryList.length > 0) {

            // 地図
            let geometryList: THREE.BufferGeometry[] = [];

            // 地域ごとにThree.Geometryを統合してSceneに追加する
            const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 1.0
            });

            // topoJsonで区切られた地域ごとにThree.Geometryを作る
            this.topoGeometryList.forEach((geo) => {
                if (geo.type === 'Polygon') {
                    const arcs: number[][] = geo.arcs;
                    arcs.forEach((arcIdxList) => {
                        const geometry: THREE.ExtrudeGeometry = this.threeGeometry(lon2x, lat2z, arcIdxList, this.topoArcList);
                        geometryList.push(geometry);
                    });
                }
                else if (geo.type === 'MultiPolygon') {
                    const arcs: number[][][] = geo.arcs;
                    arcs.forEach(arc => {
                        let geometryList0: THREE.BufferGeometry[] = [];
                        arc.forEach((arcIdxList) => {
                            const geometry0: THREE.ExtrudeGeometry = this.threeGeometry(lon2x, lat2z, arcIdxList, this.topoArcList);
                            geometryList0.push(geometry0);
                        })
                        const geometry: THREE.BufferGeometry = mergeBufferGeometries(geometryList0);
                        geometryList.push(geometry);
                    })

                }
                else if (geo.type === 'LineString') {
                    const arcIdxList: number[] = geo.arcs;
                    const geometry: THREE.BufferGeometry = this.threeGeometry(lon2x, lat2z, arcIdxList, this.topoArcList);
                    this.mapMesh = new THREE.Mesh(geometry, material);
                    this.mapMesh.rotateX(-Math.PI / 2); // xz平面が地平面なので回転させる
                    scene.add(this.mapMesh);
                }
            });

            if (geometryList.length > 0) {
                const geometry: THREE.BufferGeometry = mergeBufferGeometries(geometryList);
                this.mapMesh = new THREE.Mesh(geometry, material);
                this.mapMesh.rotateX(-Math.PI / 2); // xz平面が地平面なので回転させる
                scene.add(this.mapMesh);
            }
            this.isDraw = true;
        }
    }

    private threeGeometry(lon2x: Function, lat2z: Function, arcIdxList: number[], arcList: Vertex[][]): THREE.ExtrudeGeometry {
        const shape: THREE.Shape = new THREE.Shape();
        let firstPoint: boolean = true;

        arcIdxList.forEach((arcIndex) => {
            // console.log(arcIndex, arcList[~arcIndex])

            if (arcIndex >= 0) {
                const arc = arcList[arcIndex];
                for (let i = 0; i < arc.length; i++) {
                    const x: number = lon2x(arc[i].lon, this.centerLon)
                    const y: number = lat2z(arc[i].lat, this.centerLat)
                    if (firstPoint) {
                        shape.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        shape.lineTo(x, y);
                    }
                }
            } else {
                const arc = arcList[~arcIndex];
                for (let i = arc.length - 1; i >= 0; i--) {
                    const x: number = lon2x(arc[i].lon, this.centerLon)
                    const y: number = lat2z(arc[i].lat, this.centerLat)
                    if (firstPoint) {
                        shape.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        shape.lineTo(x, y);
                    }
                }
            }
        });
        const geometry: THREE.ExtrudeGeometry = new THREE.ExtrudeGeometry(shape, {
            steps: 2,
            depth: 0.5,
            bevelEnabled: false
        });
        return geometry;
    }

}






export class Vertex {
    lon: number;
    lat: number;

    constructor(x: number, y: number) {
        this.lon = x;
        this.lat = y;
    }
}