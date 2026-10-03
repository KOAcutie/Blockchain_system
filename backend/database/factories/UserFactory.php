<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $studentRole = Role::firstOrCreate(
            ['name' => 'student'],
            ['label' => 'Student', 'description' => 'Enrolled University Student']
        );

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'student_id' => fake()->numberBetween(20, 26) . '-' . fake()->unique()->numerify('#####'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role_id' => $studentRole->id,
            'status' => 'active',
            'college' => 'College of Computer and Information Sciences',
            'program' => 'BS Computer Science',
            'year_level' => '3rd Year',
            'remember_token' => Str::random(10),
        ];
    }

    public function officer(): static
    {
        return $this->state(function () {
            $officerRole = Role::firstOrCreate(
                ['name' => 'officer'],
                ['label' => 'SSC Officer', 'description' => 'Supreme Student Council Officer']
            );

            return [
                'role_id' => $officerRole->id,
                'student_id' => null,
                'position' => 'SSC Vice President for Finance & Audit',
            ];
        });
    }

    public function admin(): static
    {
        return $this->state(function () {
            $adminRole = Role::firstOrCreate(
                ['name' => 'admin'],
                ['label' => 'System Administrator', 'description' => 'SSC Transparency System Administrator']
            );

            return [
                'role_id' => $adminRole->id,
                'student_id' => null,
                'position' => 'System Administrator',
            ];
        });
    }
}
