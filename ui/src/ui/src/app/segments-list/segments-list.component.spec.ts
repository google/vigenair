/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the MIT License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.mit.edu/~amini/LICENSE.md
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentsListComponent } from './segments-list.component';

describe('SegmentsListComponent', () => {
  let component: SegmentsListComponent;
  let fixture: ComponentFixture<SegmentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
