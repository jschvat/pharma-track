#!/bin/bash

# Claude Audio Notifications Script
# Usage: ./claude-audio-notifications.sh [task-complete|input-needed]

NOTIFICATION_TYPE=${1:-"task-complete"}

# Create notification sounds using system beep
notify_task_complete() {
    echo "🎵 Task completed notification"
    # Three ascending beeps for task completion
    for freq in 800 1000 1200; do
        pactl load-module module-sine frequency=$freq &
        sleep 0.3
        pactl unload-module module-sine
    done 2>/dev/null
    
    # Alternative using espeak if available
    if command -v espeak &> /dev/null; then
        espeak -s 150 -p 50 "Task completed" 2>/dev/null &
    fi
}

notify_input_needed() {
    echo "🔔 Input needed notification"
    # Two gentle beeps for input needed
    for i in {1..2}; do
        pactl load-module module-sine frequency=600 &
        sleep 0.2
        pactl unload-module module-sine
        sleep 0.1
    done 2>/dev/null
    
    # Alternative using espeak if available
    if command -v espeak &> /dev/null; then
        espeak -s 120 -p 40 "Input needed" 2>/dev/null &
    fi
}

# Main execution
case $NOTIFICATION_TYPE in
    "task-complete")
        notify_task_complete
        ;;
    "input-needed")
        notify_input_needed
        ;;
    *)
        echo "Usage: $0 [task-complete|input-needed]"
        echo "  task-complete: Play completion sound"
        echo "  input-needed:  Play input needed sound"
        exit 1
        ;;
esac

echo "🔊 Audio notification sent: $NOTIFICATION_TYPE"