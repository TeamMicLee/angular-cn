/*
* API List & Filter Component
*
* A page that displays a formatted list of the public Angular API entities.
* Clicking on a list item triggers navigation to the corresponding API entity document.
* Can add/remove API entity links based on filter settings.
*/

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { combineLatest, Observable, ReplaySubject } from 'rxjs';

import { LocationService } from 'app/shared/location.service';
import { ApiSection, ApiService } from './api.service';

import { Option } from 'app/shared/select/select.component';
import { map } from 'rxjs/operators';

class SearchCriteria {
  query ? = '';
  status ? = 'all';
  type ? = 'all';
}

@Component({
  selector: 'aio-api-list',
  templateUrl: './api-list.component.html',
})
export class ApiListComponent implements OnInit {

  filteredSections: Observable<ApiSection[]>;

  showStatusMenu = false;
  showTypeMenu = false;

  private criteriaSubject = new ReplaySubject<SearchCriteria>(1);
  private searchCriteria = new SearchCriteria();

  status: Option;
  type: Option;

  // API types
  types: Option[] = [
    { value: 'all', title: '全部' },
    { value: 'class', title: '类' },
    { value: 'const', title: '常量'},
    { value: 'decorator', title: '装饰器' },
    { value: 'directive', title: '指令' },
    { value: 'enum', title: '枚举' },
    { value: 'function', title: '函数' },
    { value: 'interface', title: '接口' },
    { value: 'pipe', title: '管道'},
    { value: 'ngmodule', title: 'NgModule'},
    { value: 'type-alias', title: '类型别名' },
    { value: 'package', title: '包'}
  ];

  statuses: Option[] = [
    { value: 'all', title: '全部' },
    { value: 'deprecated', title: '弃用' },
    { value: 'security-risk', title: '安全风险' }
  ];

  @ViewChild('filter', { static: true }) queryEl: ElementRef;

  constructor(
    private apiService: ApiService,
    private locationService: LocationService) { }

  ngOnInit() {
    this.filteredSections =
        combineLatest(
          this.apiService.sections,
          this.criteriaSubject
        ).pipe(
          map( results => ({ sections: results[0], criteria: results[1]})),
          map( results => (
               results.sections
                  .map(section => ({ ...section, items: this.filterSection(section, results.criteria) }))
          ))
        );

    this.initializeSearchCriteria();
  }

  // TODO: may need to debounce as the original did
  // although there shouldn't be any perf consequences if we don't
  setQuery(query: string) {
    this.setSearchCriteria({query: (query || '').toLowerCase().trim() });
  }

  setStatus(status: Option) {
    this.toggleStatusMenu();
    this.status = status;
    this.setSearchCriteria({status: status.value});
  }

  setType(type: Option) {
    this.toggleTypeMenu();
    this.type = type;
    this.setSearchCriteria({type: type.value});
  }

  toggleStatusMenu() {
    this.showStatusMenu = !this.showStatusMenu;
  }

  toggleTypeMenu() {
    this.showTypeMenu = !this.showTypeMenu;
  }

  //////// Private //////////

  private filterSection(section: ApiSection, { query, status, type }: SearchCriteria) {
    const items = section.items!.filter(item => {
      return matchesType() && matchesStatus() && matchesQuery();

      function matchesQuery() {
        return !query ||
          section.name.indexOf(query) !== -1 ||
          item.name.indexOf(query) !== -1;
      }

      function matchesStatus() {
        return status === 'all' ||
          status === item.stability ||
          (status === 'security-risk' && item.securityRisk);
      }

      function matchesType() {
        return type === 'all' || type === item.docType;
      }
    });

    // If there are no items we still return an empty array if the section name matches and the type is 'package'
    return items.length ? items : (type === 'package' && (!query || section.name.indexOf(query) !== -1)) ? [] : null;
  }

  // Get initial search criteria from URL search params
  private initializeSearchCriteria() {
    const {query, status, type} = this.locationService.search();

    const q = (query || '').toLowerCase();
    // Hack: can't bind to query because input cursor always forced to end-of-line.
    this.queryEl.nativeElement.value = q;

    this.status = this.statuses.find(x => x.value === status) || this.statuses[0];
    this.type = this.types.find(x => x.value === type) || this.types[0];

    this.searchCriteria = {
      query: q,
      status: this.status.value,
      type: this.type.value
    };

    this.criteriaSubject.next(this.searchCriteria);
  }

  private setLocationSearch() {
    const {query, status, type} = this.searchCriteria;
    const params = {
      query:  query ? query : undefined,
      status: status !== 'all' ? status : undefined,
      type:   type   !== 'all' ? type   : undefined
    };

    this.locationService.setSearch('API 搜索', params);
  }

  private setSearchCriteria(criteria: SearchCriteria) {
    this.criteriaSubject.next(Object.assign(this.searchCriteria, criteria));
    this.setLocationSearch();
  }
}
