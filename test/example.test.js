// Contoh test sederhana menggunakan Jest
describe('Contoh Test Suite', () => {
    // Test case pertama
    test('seharusnya mengembalikan true', () => {
        expect(true).toBe(true);
    });

    // Test case kedua
    test('seharusnya bisa menjumlahkan dua angka', () => {
        const hasil = 2 + 2;
        expect(hasil).toBe(4);
    });
});
