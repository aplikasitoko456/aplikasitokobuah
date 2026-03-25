export interface Fruit {
  id: number;
  name: string;
  price_per_kg: number;
}

export interface InventoryItem {
  name: string;
  total_stock: string;
}

export interface JournalEntry {
  id: number;
  date: string;
  description: string;
  account_name: string;
  debit: number;
  credit: number;
  transaction_id?: number;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface ProfitLossReport {
  sales: number;
  beginningInventory: number;
  purchases: number;
  endingInventory: number;
  hpp: number;
  grossProfit: number;
  expenses: {
    biayaGaji: number;
    biayaATK: number;
    biayaKonsumsi: number;
    biayaBPJS: number;
    biayaSewa: number;
    biayaJasa: number;
    biayaListrikAirKebersihan: number;
    biayaPajak: number;
    biayaPerijinan: number;
    biayaAsuransi: number;
    biayaPenyusutan: number;
    biayaLainnya: number;
    total: number;
  };
  netProfit: number;
}

export interface BalanceSheetReport {
  aktivaLancar: {
    kas: number;
    bank: number;
    piutangDagang: number;
    piutangLainnya: number;
    persediaanBarang: number;
    pajakDibayarDimuka: number;
    aktivaLancarLainnya: number;
    total: number;
  };
  aktivaTetap: {
    tanahBangunan: number;
    kendaraan: number;
    inventaris: number;
    akumulasiPenyusutan: number;
    total: number;
  };
  aktivaTidakLancarLainnya: {
    piutangJangkaPanjang: number;
    biayaDitangguhkan: number;
    total: number;
  };
  pasivaLancar: {
    utangDagang: number;
    utangGaji: number;
    utangSewa: number;
    utangPPh21: number;
    utangPPh23: number;
    utangPPh4_2: number;
    utangPPN: number;
    pendapatanDiterimaDimuka: number;
    utangLancarLainnya: number;
    total: number;
  };
  pasivaJangkaPanjang: {
    utangBank: number;
    utangJangkaPanjangLainnya: number;
    total: number;
  };
  ekuitas: {
    modal: number;
    labaDitahan: number;
    labaTahunBerjalan: number;
    total: number;
  };
  totalAktiva: number;
  totalPasiva: number;
}
