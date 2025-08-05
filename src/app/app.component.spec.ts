import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, FormsModule],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have initial empty arrays for people and billItems', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.people).toEqual([]);
    expect(app.billItems).toEqual([]);
  });

  it('should render the main title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('💰 Bill Splitter');
  });

  it('should add a person when addPerson is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    app.newPersonName = 'John Doe';
    app.addPerson();
    
    expect(app.people.length).toBe(1);
    expect(app.people[0].name).toBe('John Doe');
    expect(app.people[0].totalOwed).toBe(0);
    expect(app.newPersonName).toBe(''); // Should reset form
  });

  it('should not add a person with empty name', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    app.newPersonName = '   '; // Only whitespace
    app.addPerson();
    
    expect(app.people.length).toBe(0);
  });

  it('should calculate balances correctly for a simple bill item', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Add two people
    app.newPersonName = 'Alice';
    app.addPerson();
    app.newPersonName = 'Bob';
    app.addPerson();
    
    // Add a bill item shared by both
    app.billItems = [{
      id: 1,
      name: 'Pizza',
      amount: 20,
      gotBy: 1,
      sharedBy: [1, 2]
    }];
    
    app.calculateBalances();
    
    expect(app.people[0].totalOwed).toBe(10); // Alice owes $10
    expect(app.people[1].totalOwed).toBe(10); // Bob owes $10
  });

  it('should calculate tax and tip proportionally', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Add one person
    app.newPersonName = 'Alice';
    app.addPerson();
    
    // Add a bill item
    app.billItems = [{
      id: 1,
      name: 'Dinner',
      amount: 100,
      gotBy: 1,
      sharedBy: [1]
    }];
    
    app.taxAmount = 10; // 10% tax
    app.tipAmount = 20; // 20% tip
    
    app.calculateBalances();
    
    // Alice should owe: $100 + $10 (tax) + $20 (tip) = $130
    expect(app.people[0].totalOwed).toBe(130);
  });

  it('should handle "Shared by Everyone" option correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Add three people
    app.newPersonName = 'Alice';
    app.addPerson();
    app.newPersonName = 'Bob';
    app.addPerson();
    app.newPersonName = 'Charlie';
    app.addPerson();
    
    // Add item with "Shared by Everyone" (-1)
    app.newItemName = 'Appetizer';
    app.newItemAmount = 30;
    app.selectedGetter = -1;
    app.addBillItem();
    
    const addedItem = app.billItems[0];
    expect(addedItem.gotBy).toBe(-1);
    expect(addedItem.sharedBy).toEqual([1, 2, 3]); // All people IDs
    
    // Each person should owe $10
    expect(app.people[0].totalOwed).toBe(10);
    expect(app.people[1].totalOwed).toBe(10);
    expect(app.people[2].totalOwed).toBe(10);
  });

  it('should remove person and clean up related data', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Add two people
    app.newPersonName = 'Alice';
    app.addPerson();
    app.newPersonName = 'Bob';
    app.addPerson();
    
    // Add bill item for Alice
    app.billItems = [{
      id: 1,
      name: 'Coffee',
      amount: 5,
      gotBy: 1, // Alice's ID
      sharedBy: [1, 2]
    }];
    
    // Remove Alice (ID: 1)
    app.removePerson(1);
    
    expect(app.people.length).toBe(1);
    expect(app.people[0].name).toBe('Bob');
    expect(app.billItems.length).toBe(0); // Item should be removed since Alice got it
  });

  it('should toggle person in bill item sharing correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Add two people
    app.newPersonName = 'Alice';
    app.addPerson();
    app.newPersonName = 'Bob';
    app.addPerson();
    
    // Add bill item shared only by Alice
    app.billItems = [{
      id: 1,
      name: 'Coffee',
      amount: 5,
      gotBy: 1,
      sharedBy: [1] // Only Alice
    }];
    
    // Add Bob to sharing
    app.togglePersonInItem(1, 2); // itemId: 1, personId: 2 (Bob)
    expect(app.billItems[0].sharedBy).toEqual([1, 2]);
    
    // Remove Alice from sharing
    app.togglePersonInItem(1, 1); // itemId: 1, personId: 1 (Alice)
    expect(app.billItems[0].sharedBy).toEqual([2]);
  });
});
