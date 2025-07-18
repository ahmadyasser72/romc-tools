import { describe, it, expect } from 'vitest';
import {
	calculate_safe_refine_range,
	calculate_equipment_price,
	costs,
	EquipmentState,
	type SafeRefineCost,
	calculate_safe_refine_cost,
	type SafeRefineOptions,
	type RefineRange,
} from './safe-refine';

describe('safe refine costs data', () => {
	it('+1 to +15 data should be defined', () => {
		expect(costs).toHaveLength(15);

		for (let idx = 1; idx <= 15; idx += 1) {
			const cost = costs[idx - 1];
			expect(cost.zeny).toBeTypeOf('number');
			expect(cost.copy).toBeTypeOf('number');
			expect(cost.material).toBeTypeOf('number');
		}
	});
});

describe('safe refine calculations', () => {
	it('should calculate +4 to +8 correctly', () => {
		const refine_5 = costs[4];
		const refine_6 = costs[5];
		const refine_7 = costs[6];
		const refine_8 = costs[7];

		const refine_4_to_8: SafeRefineCost = { zeny: 0, copy: 0, material: 0 };
		refine_4_to_8.zeny += refine_5.zeny + refine_6.zeny + refine_7.zeny + refine_8.zeny;
		refine_4_to_8.copy += refine_5.copy + refine_6.copy + refine_7.copy + refine_8.copy;
		refine_4_to_8.material +=
			refine_5.material + refine_6.material + refine_7.material + refine_8.material;

		expect(calculate_safe_refine_range([4, 8])).toEqual(refine_4_to_8);
	});

	it('should properly handle noop (same refine_from and refine_to)', () => {
		const result_0 = calculate_safe_refine_range([0, 0]);
		expect(result_0.zeny).toBe(0);
		expect(result_0.copy).toBe(0);
		expect(result_0.material).toBe(0);

		const result_12 = calculate_safe_refine_range([12, 12]);
		expect(result_12.zeny).toBe(0);
		expect(result_12.copy).toBe(0);
		expect(result_12.material).toBe(0);
	});
});

describe('safe refine cost calculations', () => {
	it('should calculate correctly', () => {
		const refine_range: RefineRange = [8, 12];
		const result_8_12 = calculate_safe_refine_range(refine_range);

		const base_options = {
			apply_home_rating_discount: true,
			equipment: { base_price: 300_000, state: EquipmentState.Clean },
			material_price: 25_000,
		} satisfies SafeRefineOptions;

		const result = calculate_safe_refine_cost(refine_range, base_options);
		expect(result.zeny).toBe(result_8_12.zeny * 0.95);
		expect(result.material_zeny).toBe(result_8_12.material * base_options.material_price);
		expect(result.copy_zeny).toBe(
			result_8_12.copy * calculate_equipment_price(base_options.equipment)
		);

		const result_no_discount = calculate_safe_refine_cost(refine_range, {
			...base_options,
			apply_home_rating_discount: false,
		});
		expect(result_no_discount.zeny).toBe(result_8_12.zeny);
		expect(result_no_discount.material_zeny).toBe(
			result_8_12.material * base_options.material_price
		);
		expect(result_no_discount.copy_zeny).toBe(
			result_8_12.copy * calculate_equipment_price(base_options.equipment)
		);
	});
});

describe('equipment price calculations', () => {
	it('should calculate correctly', () => {
		const base_prices = [67_915, 300_000, 750_000, 855_445, 1_591_604];
		const broken_1s = [68_958, 185_000, 410_000, 462_723, 830_802];
		const broken_2s = [113_958, 230_000, 455_000, 507_723, 875_802];
		const broken_3s = [168_958, 285_000, 510_000, 562_723, 930_802];
		const broken_4s = [233_958, 350_000, 575_000, 627_723, 995_802];

		for (let idx = 0; idx < base_prices.length; idx += 1) {
			const base_price = base_prices[idx];
			const broken_1 = broken_1s[idx];
			const broken_2 = broken_2s[idx];
			const broken_3 = broken_3s[idx];
			const broken_4 = broken_4s[idx];

			expect(calculate_equipment_price({ base_price, state: EquipmentState.Broken1 })).toBe(
				broken_1
			);
			expect(calculate_equipment_price({ base_price, state: EquipmentState.Broken2 })).toBe(
				broken_2
			);
			expect(calculate_equipment_price({ base_price, state: EquipmentState.Broken3 })).toBe(
				broken_3
			);
			expect(calculate_equipment_price({ base_price, state: EquipmentState.Broken4 })).toBe(
				broken_4
			);
		}
	});

	it('should handle clean state', () => {
		const base_price = 500_000;
		const clean = calculate_equipment_price({ base_price, state: EquipmentState.Clean });
		expect(clean).toBe(base_price);
	});

	it('should properly handle noop (0 equipment price)', () => {
		const clean = calculate_equipment_price({ base_price: 0, state: EquipmentState.Clean });
		expect(clean).toBe(0);

		const broken = calculate_equipment_price({ base_price: 0, state: EquipmentState.Broken3 });
		expect(broken).toBe(0);
	});
});
