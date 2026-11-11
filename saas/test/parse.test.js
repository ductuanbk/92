import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTable, rowsToUnits, toNumber, canonStatus, sheetCsvUrl } from '../src/parse.js';
import { SAMPLE } from './helpers.js';

test('đọc số tiền và diện tích theo nhiều cách ghi', () => {
  assert.equal(toNumber('10.203.235.501', 'money'), 10203235501);
  assert.equal(toNumber('20,873,934,525', 'money'), 20873934525);
  assert.equal(toNumber('8,15 tỷ', 'money'), 8150000000);
  assert.equal(toNumber('950 triệu', 'money'), 950000000);
  assert.equal(toNumber('150,4', 'area'), 150.4);
  assert.equal(toNumber('1.234,5', 'area'), 1234.5);
  assert.equal(toNumber('131.5 m2', 'area'), 131.5);
  assert.equal(toNumber('-', 'area'), null);
});

test('chuẩn hóa tình trạng', () => {
  assert.equal(canonStatus('Còn trống'), 'Còn hàng');
  assert.equal(canonStatus('ĐÃ BÁN'), 'Đã bán');
  assert.equal(canonStatus('Đang lock'), 'Đang lock');
  assert.equal(canonStatus('đặt cọc'), 'Đã cọc');
  assert.equal(canonStatus('Check admin'), 'Check admin');
  assert.equal(canonStatus('xyz'), '');
});

test('tách bảng dán từ Excel và CSV có ngoặc kép', () => {
  assert.equal(parseTable('a\tb\n1\t2').length, 2);
  const csv = parseTable('Mã căn,Ghi chú\nA-1,"có dấu, phẩy"\nA-2,"dòng 1\ndòng 2"');
  assert.deepEqual(csv[1], ['A-1', 'có dấu, phẩy']);
  assert.equal(csv[2][1], 'dòng 1\ndòng 2');
});

test('tìm dòng tiêu đề, khớp cột, dòng nhóm làm phân khu', () => {
  const r = rowsToUnits(parseTable(SAMPLE));
  assert.equal(r.headerRow, 1);
  assert.equal(r.units.length, 3);
  const [a, b, c] = r.units;
  assert.equal(a.code, 'AS47-16');
  assert.equal(a.price, 10203235501);
  assert.equal(a.priceLoan, 10466428445);
  assert.equal(a.build, 150.4);
  assert.equal(a.status, 'Còn hàng');
  assert.equal(a.zone, 'PHÂN KHU THÔ');
  assert.equal(a.street, 'AS47');
  assert.equal(a.ptg, 'https://drive.google.com/file/d/abc/view');
  assert.equal(b.price, 8150000000);
  assert.equal(b.status, 'Đã bán');
  assert.equal(c.ptg, '', 'link không hợp lệ bị bỏ');
  assert.equal(r.columns.price, 'Giá gồm VAT và KPBT');
});

test('không có cột Mã căn thì báo lỗi rõ ràng', () => {
  const r = rowsToUnits(parseTable('a,b\n1,2'));
  assert.equal(r.units.length, 0);
  assert.match(r.warnings[0], /Mã căn/);
});

test('link Google Sheet → link CSV đúng tab, chặn tên miền khác', () => {
  assert.equal(sheetCsvUrl('https://docs.google.com/spreadsheets/d/1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc/edit#gid=123'),
    'https://docs.google.com/spreadsheets/d/1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc/export?format=csv&gid=123');
  assert.equal(sheetCsvUrl('https://evil.com/spreadsheets/d/1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc/edit'), '');
  assert.equal(sheetCsvUrl('http://docs.google.com/spreadsheets/d/1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc'), '');
});
