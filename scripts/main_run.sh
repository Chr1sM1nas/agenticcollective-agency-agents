#!/bin/bash

# Main run script for agency agents

# Load utility functions
source ./scripts/utils.sh

# Main execution starts here

# Agent selection logic
selected_agents=$(select_agents)

# Run divisions for selected agents
for agent in $selected_agents; do
    run_agent_division "$agent"
done

# End of script
