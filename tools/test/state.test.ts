import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debouncedSaveState } from '../../subsystems/state/state';

// Notice: The "declare global" block has been completely removed!

describe('State Management: debouncedSaveState', () => {
    let setItemSpy: any; 

    beforeEach(() => {
        vi.useFakeTimers();
        
        setItemSpy = vi.spyOn(window.localStorage, 'setItem');
        
        // Fix: Cast 'window' to 'any' right here to bypass the strict type check
        // without ruining your project's global type definitions!
        (window as any).appState = {
            user: { name: 'Test User', bio: '', email: '' },
            ui: { theme: 'light', dismissedSuggestion: false },
            data: { visitCount: 1 },
            subscribers: []
        };

        debouncedSaveState();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers(); 
        vi.restoreAllMocks();
    });

    it('should wait exactly 2 seconds before saving to localStorage', () => {
        debouncedSaveState();
        vi.advanceTimersByTime(1900);
        
        expect(setItemSpy).not.toHaveBeenCalledWith(
            'vent_app_state',
            expect.any(String)
        );

        vi.advanceTimersByTime(100);
        
        expect(setItemSpy).toHaveBeenCalledWith(
            'vent_app_state',
            expect.any(String)
        );
    });

    it('should reset the timer if called multiple times rapidly', () => {
        debouncedSaveState();
        vi.advanceTimersByTime(1000); 
        debouncedSaveState();
        vi.advanceTimersByTime(1000);
        debouncedSaveState(); 

        expect(setItemSpy).not.toHaveBeenCalledWith(
            'vent_app_state',
            expect.any(String)
        );

        vi.advanceTimersByTime(2000);
        
        const stateSaves = setItemSpy.mock.calls.filter(
            (call: any) => call[0] === 'vent_app_state'
        );
        
        expect(stateSaves.length).toBe(1);
    });
});