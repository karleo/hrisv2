<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_compensation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_compensation_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16); // allowance | deduction
            $table->string('name', 255);
            $table->decimal('amount', 12, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $this->migrateLegacyAllowancesAndDeductionsToItems();
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_compensation_items');
    }

    private function migrateLegacyAllowancesAndDeductionsToItems(): void
    {
        if (! Schema::hasTable('employee_compensations')) {
            return;
        }

        $compensations = DB::table('employee_compensations')->get();

        foreach ($compensations as $compensation) {
            $sortOrder = 0;
            $items = [
                ['type' => 'allowance', 'name' => 'Housing', 'amount' => $compensation->housing_allowance],
                ['type' => 'allowance', 'name' => 'Transport', 'amount' => $compensation->transport_allowance],
                ['type' => 'allowance', 'name' => 'Food', 'amount' => $compensation->food_allowance],
                ['type' => 'allowance', 'name' => 'Other allowance', 'amount' => $compensation->other_allowance],
                ['type' => 'deduction', 'name' => 'Loan / cash advance', 'amount' => $compensation->loan_deduction],
                ['type' => 'deduction', 'name' => 'Other deduction', 'amount' => $compensation->other_deduction],
            ];

            foreach ($items as $item) {
                if ((float) $item['amount'] <= 0) {
                    continue;
                }

                DB::table('employee_compensation_items')->insert([
                    'employee_compensation_id' => $compensation->id,
                    'type' => $item['type'],
                    'name' => $item['name'],
                    'amount' => $item['amount'],
                    'sort_order' => $sortOrder++,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
