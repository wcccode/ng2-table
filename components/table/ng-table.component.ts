import { Component, EventEmitter, Input, Output, HostListener,  AfterViewChecked, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ScrollEvent } from './scroll.directive'

@Component({
  selector: 'ng-table',
  template: `
    <table class="ngtable" ngClass="{{config.className || ''}}" role="grid" >
      <thead [ngStyle]="firstRowStyle">
        <tr role="row">
          <th *ngFor="let column of columns; let i=index" id="th{{i}}" [ngStyle]="i==0 ? firstColumnStyle : ''" [ngTableSorting]="config" [column]="column" 
              (sortChanged)="onChangeTable($event)" ngClass="{{column.className || ''}}" >
            {{column.title}}
            <i *ngIf="config && column.sort" class="pull-right fa"
              [ngClass]="{'fa-chevron-down': column.sort === 'desc', 'fa-chevron-up': column.sort === 'asc'}"></i>
          </th>
        </tr>
        <tr *ngIf="showFilterRow">
        <th *ngFor="let column of columns; let i=index" [ngStyle]="i==0 ? firstColumnStyle : ''">
          <input *ngIf="column.filtering" placeholder="{{column.filtering.placeholder}}"
                 [ngTableFiltering]="column.filtering"
                 class="form-control"
                 (tableChanged)="onChangeTable(config)"/>
        </th>
      </tr>
      </thead>
      <tbody detect-scroll (onScroll)="handleScroll($event)">
        <tr *ngFor="let row of rows; let ridx=index">
          <td (click)="cellClick(row, column.name)" class="{{ridx==0 ? 'firstTd' : ''}}" id="{{ridx==0 ? 'td'+i: ''}}" [ngStyle]="i==0 ? firstColumnStyle : ''" ngClass="{{column.rowClassName || ''}}" *ngFor="let column of columns; let i=index" [innerHtml]="sanitize(getData(row, column.name))"></td>
        </tr>
        <tr *ngIf="rows.length > 0 && showAggregateRow">
          <td *ngFor="let column of columns">
            <span *ngIf="column.aggregate">{{column.aggregate(rows, column.name)}}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    .ngtable{
      position: relative;
      width: 700px;
      overflow: hidden;
      border-collapse: collapse;
       background-color: #34495E;
      color: #fff;
    }

    /*thead*/
    .ngtable thead {
      position: relative;
      display: block; /*seperates the header from the body allowing it to be positioned*/
      width: 700px;
      overflow: visible;
      background: #34495E;
      color: #fff;
    }

    .ngtable thead th {
      min-width: 120px;
      border: 0!important;
      border: 0px solid #222;
      background-color: #34495E;
      color: #fff;
      padding: 0.5rem;
    }

    .ngtable thead th:nth-child(1) {/*first cell in the header*/
      position: relative;
      display: block; /*seperates the first cell in the header from the header*/
      border-bottom: 0px;
      line-height: 2;
    }


    /*tbody*/
    .ngtable tbody {
      position: relative;
      display: block; /*seperates the tbody from the header*/
      width: 700px;
      height: 239px;
      overflow: scroll;
    }

    .ngtable tbody td {
      min-width: 8rem;
      border: 0!important;
      white-space: nowrap;
      word-break: break-all;
      padding: 0.5rem;
      min-height: 3rem;
    }

    .ngtable tbody tr td:nth-child(1) {  /*the first cell in each tr*/
      position: relative;
      display: block; /*seperates the first column from the tbody*/
      background-color: #34495E;
      color: #fff;
        line-height: 2;
    }
  `]
})
export class NgTableComponent implements  AfterViewChecked, AfterViewInit{
  // Table values
  @Input() public rows:Array<any> = [];

  @Input()
  public set config(conf:any) {
    if (!conf.className) {
      conf.className = 'table-striped table-bordered';
    }
    if (conf.className instanceof Array) {
      conf.className = conf.className.join(' ');
    }
    if (!conf.hasOwnProperty("defaultScrollEvent")) {
      conf.defaultScrollEvent = true;
    }
    this._config = conf;
  }

  // Outputs (Events)
  @Output() public tableChanged:EventEmitter<any> = new EventEmitter();
  @Output() public cellClicked:EventEmitter<any> = new EventEmitter();

  public showFilterRow:Boolean = false;
  public showAggregateRow:Boolean = false;
  
  @Input() public firstRowStyle: {};
  @Input() public firstColumnStyle: {};

  @Input()
  public set columns(values:Array<any>) {
    values.forEach((value:any) => {
      if (value.filtering) {
        this.showFilterRow = true;
      }
      if (value.aggregate) {
        this.showAggregateRow = true;
      }
      if (value.className && value.className instanceof Array) {
        value.className = value.className.join(' ');
      }
      let column = this._columns.find((col:any) => col.name === value.name);
      if (column) {
        Object.assign(column, value);
      }
      if (!column) {
        this._columns.push(value);
      }
    });
  }

  private _columns:Array<any> = [];
  private _config:any = {};

  public constructor(private sanitizer:DomSanitizer) {
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    this.reRenderTableHeader();
  }

  public reRenderTableHeader(){
    let elms = document.getElementsByClassName("firstTd");
    for (let i=0; i < elms.length; i++) {
      let obj = elms[i];
      //console.log(obj.id, (<any>obj)['offsetWidth']);
      // var actualWidth = window.innerWidth ||
                      // document.documentElement.clientWidth ||
                      // document.body.clientWidth ||
                      // document.body.offsetWidth;
      let target = document.getElementById(obj.id.replace("d", "h"));
      (<any>target.style)['min-width'] = (<any>obj)['offsetWidth']+"px";
    }
  }

  public sanitize(html:string):SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  public get columns():Array<any> {
    return this._columns;
  }

  public get config():any {
    return this._config;
  }

  public get configColumns():any {
    let sortColumns:Array<any> = [];

    this.columns.forEach((column:any) => {
      if (column.sort) {
        sortColumns.push(column);
      }
    });

    return {columns: sortColumns};
  }

  public onChangeTable(column:any):void {
    this._columns.forEach((col:any) => {
      if (col.name !== column.name && col.sort !== false) {
        col.sort = '';
      }
    });
    this.tableChanged.emit({sorting: this.configColumns});
  }

  public getData(row:any, propertyName:string):string {
    return propertyName.split('.').reduce((prev:any, curr:string) => prev[curr], row);
  }

  public cellClick(row:any, column:any):void {
    this.cellClicked.emit({row, column});
  }

  public handleScroll(event: ScrollEvent) {
    if (!this._config.defaultScrollEvent) {
      console.warn("disable ng-table default")
      return;
    }
    let scrollLeft = event.scrollLeft;
    this.firstRowStyle = {"left": (-scrollLeft ) + "px"};
    this.firstColumnStyle = {"left": scrollLeft + "px"};
    if (event.isReachingBottom) {
      console.log(`the user is reaching the bottom`);
    }
    if (event.isWindowEvent) {
      console.log(`This event is fired on Window not on an element.`);
    }
  }
}
