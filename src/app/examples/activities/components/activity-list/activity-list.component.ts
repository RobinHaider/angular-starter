import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { catchError, merge, startWith, switchMap, of, map } from 'rxjs';
import { Pagination } from 'src/app/core/models/pagination';
import { ActivityDto, ActivityParams } from '../../models/activity';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
})
export class ActivityListComponent implements OnInit, AfterViewInit {
  defaultParams = new ActivityParams();
  pagination: Pagination = {} as Pagination;
  activities: ActivityDto[] = [];
  displayedColumns: string[] = [
    'position',
    'title',
    'category',
    'date',
    'city',
    'venue',
  ];
  isLoadingResults = true;
  pageSizeOptions = [2, 4, 6];

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private activityService: ActivityService) {}

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.paginator.page, this.sort.sortChange)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.defaultParams.pageNumber = this.paginator.pageIndex + 1;
          this.defaultParams.pageSize = this.paginator.pageSize;
          this.defaultParams.sortBy = this.sort.active;
          this.defaultParams.sortDirection = this.sort.direction;
          console.log('Called');

          return this.loadData();
        })
      )
      .subscribe();
  }

  ngOnInit(): void {}

  applyFilter(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value;
    console.log(searchValue.trim().toLowerCase());
    this.defaultParams.search = searchValue.trim().toLocaleLowerCase();
    this.loadData().subscribe();
  }

  loadData() {
    this.isLoadingResults = true;
    return this.activityService.list(this.defaultParams).pipe(
      catchError(() => of(null)),
      map((result) => {
        if (result === null) {
          return [];
        }

        // Only refresh the result length if there is new data. In case of rate
        // limit errors, we do not want to reset the paginator to zero, as that
        // would prevent users from re-triggering requests.
        this.pagination = result.pagination;
        setTimeout(() => {
          this.isLoadingResults = false;
          this.activities = result.data;
        }, 1000);

        return result.data;
      })
    );
  }
}
