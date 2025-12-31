<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Display contact page
     */
    public function index(): Response
    {
        return Inertia::render('Public/Contact');
    }

    /**
     * Handle contact form submission
     */
    public function store(ContactRequest $request): RedirectResponse
    {
        // Send email to admin
        try {
            Mail::send('emails.contact', [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'message' => $request->message,
            ], function ($message) use ($request) {
                $message->to(config('mail.from.address'))
                    ->subject('New Contact Form Submission')
                    ->replyTo($request->email, $request->name);
            });

            return back()->with('success', 'Thank you for contacting us! We will get back to you soon.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to send message. Please try again later.');
        }
    }
}
