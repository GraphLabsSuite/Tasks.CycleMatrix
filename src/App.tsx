import React from 'react';
import './App.css';
// @ts-ignore
import {select} from 'd3-selection'
import {Matrix, } from 'graphlabs.core.lib';
import {FunctionComponent} from "react";
import {Template, ToolButtonList, Toolbar, store, IEdgeView, IGraphView} from "graphlabs.core.template";

let tree_vertex: string[] = [];
let help: string[] = [];
let tree_edge: string[] = [];

class App extends Template {

    matrix: number[][] = [];

    constructor(props: {}) {
        super(props);
        this.calculate = this.calculate.bind(this);
        this.handler = this.handler.bind(this);
    }

    handler(values: number[][]) {
        this.matrix = values;
    }

    change_color(color: string) {
        const Out = sessionStorage.getItem('out');
        const In = sessionStorage.getItem('in');
        sessionStorage.removeItem('out');
        sessionStorage.removeItem('in');
        select(`#edge_${Out}_${In}`).style('stroke', color);
        if (Out && In && color === 'blue') {
            this.spanning_tree(Out, In);
        }
    }

    spanning_tree(vertexOneName: string, vertexTwoName: string){
        if (tree_vertex.length === 0){
            tree_vertex.push(vertexOneName);
            tree_vertex.push(vertexTwoName);
            tree_edge.push(`#edge_${vertexOneName}_${vertexTwoName}`);
        }
        else if  (tree_vertex.indexOf(vertexOneName) === -1 && tree_vertex.indexOf(vertexTwoName) === -1){
            help.push(vertexOneName);
            help.push(vertexTwoName);
            tree_edge.push(`#edge_${vertexOneName}_${vertexTwoName}`);

        }
        else if (tree_vertex.indexOf(vertexOneName) !== -1 && tree_vertex.indexOf(vertexTwoName) === -1
        && help.indexOf(vertexTwoName) === -1){
            tree_vertex.push(vertexTwoName);
            tree_edge.push(`#edge_${vertexOneName}_${vertexTwoName}`);
        }
        else if (tree_vertex.indexOf(vertexOneName) === -1 && tree_vertex.indexOf(vertexTwoName) !== -1
        && help.indexOf(vertexOneName) === -1){
            tree_vertex.push(vertexOneName);
            tree_edge.push(`#edge_${vertexOneName}_${vertexTwoName}`);
        }
        else if (tree_vertex.indexOf(vertexOneName) !== -1 && help.indexOf(vertexOneName) !== -1){
            help.splice(help.indexOf(vertexOneName));
        }
        else if (tree_vertex.indexOf(vertexTwoName) !== -1 && help.indexOf(vertexTwoName) !== -1){
            help.splice(help.indexOf(vertexTwoName));
        }
        else if (tree_vertex.indexOf(vertexOneName) === -1 && help.indexOf(vertexOneName) !== -1
            || help.indexOf(vertexTwoName) !== -1 && tree_vertex.indexOf(vertexTwoName) === -1){
            tree_vertex = tree_vertex.concat(help);
            help = [];
            tree_edge.push(`#edge_${vertexOneName}_${vertexTwoName}`);
        }
    }

    getTaskToolbar() {
        Toolbar.prototype.getButtonList = () => {
            function beforeComplete(this: App):  Promise<{ success: boolean; fee: number }> {
                return new Promise((resolve => {
                    resolve(this.calculate());
                }));
            }
            ToolButtonList.prototype.beforeComplete = beforeComplete.bind(this);
            ToolButtonList.prototype.help = () =>
                'В данном задании необходимо построить остов графа и матрицу циклов\n' +
                'Для окраски ребра в синий или красный цвет щелкните по ребру, а затем по соответствующей кнопке\n' +
                'Для изменения значения в матрице кликните по нужной вам клетке\n'+
                'Порядок ребер в матрице: ' + this.get_edges();
            ToolButtonList.prototype.toolButtons = {
                "http://gl-backend.svtz.ru:5000/odata/downloadImage(name='color_blue.png')": () => {
                    this.change_color('blue');
                },
                "http://gl-backend.svtz.ru:5000/odata/downloadImage(name='color_red.png')": () => {
                    this.change_color('red');
                }
            };
            return ToolButtonList;
        };
        return Toolbar;
    }

    get_edges(){
        let edges: IEdgeView[] = store.getState().graph.edges;
        let result: string = "";
        edges.forEach(edge => result = result + edge.vertexOne + "_" + edge.vertexTwo +'\t');
        return result;
    }

    task(): FunctionComponent<{}> {
        const graph: IGraphView = store.getState().graph;
        let m: number = graph.edges.length;
        let n: number = graph.vertices.length;
        let c: number = this.scc_count;
        return () => (
            <Matrix
                rows={m + c - n}
                columns={graph.edges.length}
                readonly={false}
                handler={this.handler}
            />
        );
    }
    check_color(edge: IEdgeView){
        let Out: string = edge.vertexOne;
        let In: string = edge.vertexTwo;
        let color: string = select(`#edge_${Out}_${In}`).style('stroke');
        if (color !== 'blue'){
            this.spanning_tree(Out, In);
        }
    }

    check_tree(edge: IEdgeView){
        let Out: string = edge.vertexOne;
        let In: string = edge.vertexTwo;
        let name: string = `#edge_${Out}_${In}`;
        let color: string = select(name).style('stroke');
        if (color === 'blue' && tree_edge.indexOf(name) !== -1 ||
            color !== 'blue' && tree_edge.indexOf(name) === -1){
            return true
        }
        else{
            return false
        }
    }

    check_matrix(row: number[], edges: IEdgeView[]){
        let cycle: string[] = [];
        let result: boolean = true;
       //let flag: boolean = false;
        for(let i = 0; i < row.length; i++) {
            if (row[i] === 1){
                cycle.push(edges[i].vertexOne);
                cycle.push(edges[i].vertexTwo);
            }
        }
        /*for(let i = 0; i < edges.length; i++) {
            let Out: string = edges[i].vertexOne;
            let In: string = edges[i].vertexTwo;
            if (tree_edge.indexOf(`#edge_${Out}_${In}`) === -1){
                if (!flag) {
                    flag = !flag
                } else {
                    result = false
                }
                console.log(result);
            }
        }
        if (!flag) {
            result = false
        }*/
        for (let i = 1; i < cycle.length-1; i += 2){
            if (!(cycle[i] === cycle[i-1] && cycle[i] !== cycle[i+1])){
                result =  false
            }
        }
        return result;
    }

    calculate() {
        console.log(this.matrix);
        let res: number = 0;
        let edges: IEdgeView[]  = store.getState().graph.edges;
        edges.forEach(edge => this.check_color(edge));
        edges.forEach(edge => {
            if (!this.check_tree(edge)){
                res += 10
            }
        });
        for(let i = 0; i < this.matrix.length; i++) {
            if (!this.check_matrix(this.matrix[i], edges) || this.matrix[i].indexOf(1) === -1){
                res += 10
            }
        }
        return {success: res === 0 , fee: res}
    }
}

export default App;
