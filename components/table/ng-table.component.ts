import { Component, EventEmitter, Input, Output, HostListener,  AfterViewChecked, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ScrollEvent } from './scroll.directive'


@Component({
  selector: 'ng-table',
  template: `
   
    <table class="" ngClass="{{config.className || ''}}" role="grid" >
      <thead [ngStyle]="theadStyle">
        <tr role="row">
          <th *ngFor="let column of columns; let i=index" id="th{{i}}" [ngStyle]="i==0 ? firstThreadStyle : ''" [ngTableSorting]="config" [column]="column" 
              (sortChanged)="onChangeTable($event)" ngClass="{{column.className || ''}}" >
            {{column.title}}
            <i *ngIf="config && column.sort" class="pull-right fa"
              [ngClass]="{'fa-chevron-down': column.sort === 'desc', 'fa-chevron-up': column.sort === 'asc'}"></i>
          </th>
        </tr>
        <tr *ngIf="showFilterRow">
        <th *ngFor="let column of columns; let i=index" [ngStyle]="i==0 ? firstThreadStyle : ''">
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
        <tr *ngIf="showAggregateRow">
          <td *ngFor="let column of columns">
            <span *ngIf="column.aggregate">{{column.aggregate(rows, column.name)}}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class NgTableComponent implements  AfterViewChecked, AfterViewInit{
  public handleScroll(event: ScrollEvent) {
    this.theadStyle = {"left": -event.scrollLeft+"px"}
    this.firstThreadStyle = {"left": event.scrollLeft+"px"}
    this.firstColumnStyle = {"left": event.scrollLeft+"px"}
    if (event.isReachingBottom) {
      console.log(`the user is reaching the bottom`);

    }
    if (event.isWindowEvent) {
      console.log(`This event is fired on Window not on an element.`);
    }

  }

  ngAfterViewInit() {
    // viewChild is set after the view has been initialized
    console.log('AfterViewInit');
    
  }

  ngAfterViewChecked() {
    console.log('ngAfterViewChecked');
    let elms = document.getElementsByClassName("firstTd");
    for (let i=0; i < elms.length; i++) {
      let obj = elms[i];
      //console.log(obj.id, (<any>obj)['offsetWidth']);
      // var actualWidth = window.innerWidth ||
                      // document.documentElement.clientWidth ||
                      // document.body.clientWidth ||
                      // document.body.offsetWidth;
      let target = document.getElementById(obj.id.replace("d", "h"));
      target.style['min-width'] = (<any>obj)['offsetWidth']+"px";
      console.log(target, (<any>obj)['offsetWidth'])
    }
  }

  public reRenderTableHeader(){

  }

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
    this._config = conf;
  }

  // Outputs (Events)
  @Output() public tableChanged:EventEmitter<any> = new EventEmitter();
  @Output() public cellClicked:EventEmitter<any> = new EventEmitter();

  public showFilterRow:Boolean = false;
  public showAggregateRow:Boolean = false;
  public theadStyle: {};
  public firstThreadStyle: {};
  public firstColumnStyle: {};
  public theadThStyle: {};

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
    console.log("ng-table emit tablechange" + column)
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
}
