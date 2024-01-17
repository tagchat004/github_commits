import { Request, Response, Application } from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhnqsqktwpcfynbusfkt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobnFzcWt0d3BjZnluYnVzZmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU0Nzc3NDUsImV4cCI6MjAyMTA1Mzc0NX0.8Wv9tCksvw_95_sTHHFRi7QwT0J7ZYbAHinLLkv4ilY';
const supabase = createClient(supabaseUrl, supabaseKey);
const username = 'tagchat004';
const repo = 'github_commits';

// Fetch GitHub commits for a specific user
async function fetchCommits(since: string): Promise<number> {
    const url = `https://api.github.com/repos/${username}/${repo}/commits?since=${since}`;
    const response = await axios.get(url);
    console.log(response.data)
    if (!response) return 0;
    return response.data?.length;
}

// API endpoint to fetch and store GitHub commits in Supabase
async function fetchGithub(req: Request, res: Response){

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const commitsToday = await fetchCommits(startOfDay.toISOString());
    const commitsThisWeek = await fetchCommits(getStartOfWeek(today).toISOString());
    const commitsThisMonth = await fetchCommits(getStartOfMonth(today).toISOString());
    const commitsThisYear = await fetchCommits(getStartOfYear(today).toISOString());

    // Store the information in Supabase
    const { data, error } = await supabase
        .from('github_commits')
        .upsert([
            { username, commits_per_day: commitsToday },
            { username, commits_per_week: commitsThisWeek },
            { username, commits_per_month: commitsThisMonth },
            { username, commits_per_year: commitsThisYear },
        ]);

    if (error) {
        console.log(error)
        return res.status(500).json({ error: 'Failed to update Supabase' });
    }

    res.json({ data });

}

// Helper function to get the start of the week
function getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    startOfWeek.setUTCDate(date.getUTCDate() - date.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);
    return startOfWeek;
}

// Helper function to get the start of the month
function getStartOfMonth(date: Date): Date {
    const startOfMonth = new Date(date);
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    return startOfMonth;
}

// Helper function to get the start of the year
function getStartOfYear(date: Date): Date {
    const startOfYear = new Date(date);
    startOfYear.setUTCMonth(0, 1);
    startOfYear.setUTCHours(0, 0, 0, 0);
    return startOfYear;
}

export const routes = (app: Application): void => {
    app.get('/api/github', fetchGithub);
}