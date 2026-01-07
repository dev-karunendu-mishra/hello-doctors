<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    /**
     * Store a new email subscription.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:255'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            // Check if email already exists
            $existingSubscription = Subscription::where('email', $request->email)->first();
            
            if ($existingSubscription) {
                if ($existingSubscription->is_active) {
                    return back()->withErrors([
                        'email' => 'This email is already subscribed to our updates.'
                    ]);
                } else {
                    // Reactivate subscription
                    $existingSubscription->update([
                        'is_active' => true,
                        'subscribed_at' => now(),
                    ]);
                    
                    return back()->with('success', 'Welcome back! Your subscription has been reactivated.');
                }
            }

            // Create new subscription
            Subscription::create([
                'email' => $request->email,
                'is_active' => true,
                'subscribed_at' => now(),
            ]);

            return back()->with('success', 'Successfully subscribed to updates!');

        } catch (\Exception $e) {
            return back()->withErrors([
                'email' => 'An error occurred while subscribing. Please try again.'
            ]);
        }
    }
}
