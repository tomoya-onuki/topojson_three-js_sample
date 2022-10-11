import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import $ = require('jquery');
declare var require: any;

import { TopoJsonMap } from "./TopoJsonMap";

$(function () {
    new Main().init();
});

export class Main {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;

    constructor() {
        let cvsWidth: number = Number($('#view').width());
        let cvsHeight: number = Number($('#view').height());

        /* ************************
        * Three.jsの設定
        * ************************/
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, cvsWidth / cvsHeight, 1, 5000);

        // レンダラーを作成
        $("#view").append(this.renderer.domElement)
        this.camera.position.set(0, 300, 300);   // cameraの設定

        // orbit controlsの設定
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;
        this.controls.maxPolarAngle = Math.PI / 2;  // 垂直方向の回転の制限
        this.controls.minPolarAngle = -Math.PI / 2;  // 垂直方向の回転の制限
        this.controls.maxDistance = 500;           // ズームの制限
        this.controls.minDistance = 10;             // ズームの制限


        const axes = new THREE.AxesHelper(10);
        this.scene.add(axes);

        this.resize()

        /* ************************
       * topoJSONの読み込み
       * ************************/
        let map: TopoJsonMap = new TopoJsonMap();
        let url: string = './world_land_10m.topojson';
        // let url: string = './world_countries_10_1e4.topojson';
        fetch(url)
            .then(response => response.text())
            .then(jsonString => {
                map.read(jsonString)
                map.draw(this.scene)
            })
            .catch(err => console.log(err))
    }

    public init() {
        const me: Main = this

        this.startRender()

        $(window).on('resize', function () {
            me.resize();
        })
    }


    // アニメーション処理
    private startRender(): void {
        const me: Main = this;

        // 60fpsで固定
        // requestAnimationFrame(function() { this.startRender(); });
        // this.renderer.render(this.scene, this.camera); // レンダリング   

        // fpsを自由に設定できる
        setInterval(() => {
            me.controls.update()
            me.renderer.render(me.scene, me.camera)
        }, 1000 / 24);
    }

    private resize() {
        let cvsWidth: number = Number($('#view').width());
        let cvsHeihg: number = Number($('#view').height());

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(cvsWidth, cvsHeihg);

        this.camera.aspect = cvsWidth / cvsHeihg;
        this.camera.updateProjectionMatrix();
    }
}