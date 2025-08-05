import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Person {
  id: number;
  name: string;
  totalOwed: number;
}

interface BillItem {
  id: number;
  name: string;
  amount: number;
  gotBy: number;
  sharedBy: number[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  people: Person[] = [];
  billItems: BillItem[] = [];
  
  // Form inputs
  newPersonName = '';
  newItemName = '';
  newItemAmount = 0;
  selectedGetter: number | string = 0;
  
  // Tax and tip
  taxAmount = 0;
  tipAmount = 0;
  
  // Edit mode
  editingItemId: number | null = null;
  editItemName = '';
  editItemAmount = 0;
  editSelectedGetter: number | string = 0;
  
  nextPersonId = 1;
  nextItemId = 1;

  addPerson() {
    if (this.newPersonName.trim()) {
      this.people.push({
        id: this.nextPersonId++,
        name: this.newPersonName.trim(),
        totalOwed: 0
      });
      this.newPersonName = '';
      this.calculateBalances();
    }
  }

  removePerson(id: number) {
    this.people = this.people.filter(p => p.id !== id);
    this.billItems = this.billItems.filter(item => item.gotBy !== id);
    this.billItems.forEach(item => {
      item.sharedBy = item.sharedBy.filter(personId => personId !== id);
    });
    this.calculateBalances();
  }

  addBillItem() {
    if (this.newItemName.trim() && this.newItemAmount > 0 && this.selectedGetter) {
      const getterId = Number(this.selectedGetter);
      let sharedByList: number[];
      
      if (getterId === -1) { // -1 represents "Shared by Everyone"
        sharedByList = this.people.map(p => p.id); // Check all people
      } else {
        sharedByList = [getterId]; // Only the person who got it is initially checked
      }
      
      this.billItems.push({
        id: this.nextItemId++,
        name: this.newItemName.trim(),
        amount: this.newItemAmount,
        gotBy: getterId,
        sharedBy: sharedByList
      });
      this.newItemName = '';
      this.newItemAmount = 0;
      this.calculateBalances();
    }
  }

  removeBillItem(id: number) {
    this.billItems = this.billItems.filter(item => item.id !== id);
    this.calculateBalances();
  }

  togglePersonInItem(itemId: number, personId: number) {
    const item = this.billItems.find(i => i.id === itemId);
    if (item) {
      const index = item.sharedBy.indexOf(personId);
      if (index > -1) {
        item.sharedBy.splice(index, 1);
      } else {
        item.sharedBy.push(personId);
      }
      this.calculateBalances();
    }
  }

  calculateBalances() {
    // Reset all balances
    this.people.forEach(person => person.totalOwed = 0);

    // Calculate base amounts from bill items
    this.billItems.forEach(item => {
      if (item.sharedBy.length > 0) {
        const sharePerPerson = item.amount / item.sharedBy.length;
        
        item.sharedBy.forEach(personId => {
          const person = this.people.find(p => p.id === personId);
          if (person) {
            person.totalOwed += sharePerPerson;
          }
        });
      }
    });

    // Add tax and tip proportionally
    const totalBill = this.getTotalBill();
    if (totalBill > 0) {
      const taxPercentage = this.taxAmount / totalBill;
      const tipPercentage = this.tipAmount / totalBill;

      this.people.forEach(person => {
        const personTax = person.totalOwed * taxPercentage;
        const personTip = person.totalOwed * tipPercentage;
        person.totalOwed += personTax + personTip;
      });
    }
  }

  getPersonName(id: number): string {
    if (id === -1) {
      return 'Shared by Everyone';
    }
    return this.people.find(p => p.id === id)?.name || 'Unknown';
  }

  getTotalBill(): number {
    return this.billItems.reduce((sum, item) => sum + item.amount, 0);
  }

  getGrandTotal(): number {
    return this.getTotalBill() + this.taxAmount + this.tipAmount;
  }

  getTaxPercentage(): number {
    const total = this.getTotalBill();
    return total > 0 ? (this.taxAmount / total) * 100 : 0;
  }

  getTipPercentage(): number {
    const total = this.getTotalBill();
    return total > 0 ? (this.tipAmount / total) * 100 : 0;
  }

  onTaxTipChange(): void {
    this.calculateBalances();
  }

  isPersonInItem(itemId: number, personId: number): boolean {
    const item = this.billItems.find(i => i.id === itemId);
    return item ? item.sharedBy.includes(personId) : false;
  }

  // Helper method for template
  abs(value: number): number {
    return Math.abs(value);
  }

  // Edit item methods
  startEditItem(item: BillItem): void {
    this.editingItemId = item.id;
    this.editItemName = item.name;
    this.editItemAmount = item.amount;
    this.editSelectedGetter = item.gotBy;
  }

  saveEditItem(): void {
    if (this.editingItemId && this.editItemName.trim() && this.editItemAmount > 0 && this.editSelectedGetter) {
      const item = this.billItems.find(i => i.id === this.editingItemId);
      if (item) {
        const newGetterId = Number(this.editSelectedGetter);
        
        item.name = this.editItemName.trim();
        item.amount = this.editItemAmount;
        item.gotBy = newGetterId;
        
        // Update shared by list if getter changed
        if (newGetterId === -1) { // Shared by Everyone
          item.sharedBy = this.people.map(p => p.id);
        } else if (item.sharedBy.length === 1 && item.sharedBy[0] !== newGetterId) {
          // If it was previously a single person item, update to new person
          item.sharedBy = [newGetterId];
        }
        
        this.calculateBalances();
      }
    }
    this.cancelEditItem();
  }

  cancelEditItem(): void {
    this.editingItemId = null;
    this.editItemName = '';
    this.editItemAmount = 0;
    this.editSelectedGetter = 0;
  }

  isEditingItem(itemId: number): boolean {
    return this.editingItemId === itemId;
  }
}
