#!/bin/bash

# Define variables for compose files
BASE_COMPOSE="docker-compose.base.yml"
DEV_COMPOSE="docker-compose.dev.yml"
TEST_COMPOSE="docker-compose.test.yml"

# Function to display usage
usage() {
  echo "Usage: $0 [-e environment] [-c command] [-s service] [-r command to run]"
  echo "  -e   Specify environment (dev or test)"
  echo "  -c   Specify command (up, up-build, down, logs, ps, restart, exec, stop, start)"
  echo "  -s   Specify service (optional, used for logs, restart, exec)"
  echo "  -r   Command to run inside the container (optional, used with exec)"
  exit 1
}

# Parse flags
while getopts ":e:c:s:r:" opt; do
  case ${opt} in
    e)
      ENVIRONMENT=$OPTARG
      ;;
    c)
      COMMAND=$OPTARG
      ;;
    s)
      SERVICE=$OPTARG
      ;;
    r)
      RUN_COMMAND=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" 1>&2
      usage
      ;;
    :)
      echo "Option -$OPTARG requires an argument." 1>&2
      usage
      ;;
  esac
done

# Check if environment and command are provided
if [ -z "$ENVIRONMENT" ]; then
  echo "Error: Environment not specified"
  usage
fi

if [ -z "$COMMAND" ]; then
  echo "Error: Command not specified"
  usage
fi

# Determine which compose file to use based on the environment
COMPOSE_FILE=""
if [ "$ENVIRONMENT" == "dev" ]; then
  COMPOSE_FILE=$DEV_COMPOSE
elif [ "$ENVIRONMENT" == "test" ]; then
  COMPOSE_FILE=$TEST_COMPOSE
else
  echo "Invalid environment: $ENVIRONMENT"
  usage
fi

# Execute the appropriate Docker Compose command
case "$COMMAND" in
  up)
    if [ "$ENVIRONMENT" == "test" ]; then
      # For test environment, show logs in real-time (watch mode)
      echo "Starting containers for $ENVIRONMENT environment (watch mode)..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE up
    else
      # For dev environment, run in detached mode
      echo "Starting containers for $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE up
    fi
    ;;
  up-build)
    if [ "$ENVIRONMENT" == "test" ]; then
      echo "Building and starting containers for $ENVIRONMENT environment (watch mode)..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE up --build
    else
      echo "Building and starting containers for $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE up --build
    fi
    ;;
  down)
    echo "Stopping and removing containers for $ENVIRONMENT environment..."
    docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE down
    ;;
  logs)
    if [ -n "$SERVICE" ]; then
      echo "Following logs for $SERVICE in $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE logs -f $SERVICE
    else
      echo "Following logs for all services in $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE logs -f
    fi
    ;;
  ps)
    echo "Listing containers for $ENVIRONMENT environment..."
    docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE ps
    ;;
  restart)
    if [ -n "$SERVICE" ]; then
      echo "Restarting $SERVICE in $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE restart $SERVICE
    else
      echo "Restarting all services in $ENVIRONMENT environment..."
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE restart
    fi
    ;;
  exec)
    if [ -n "$SERVICE" ] && [ -n "$RUN_COMMAND" ]; then
      echo "Executing command in $SERVICE: $RUN_COMMAND"
      docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE exec $SERVICE $RUN_COMMAND
    else
      echo "You need to specify both a service and a command to execute."
      usage
    fi
    ;;
  stop)
    echo "Stopping containers for $ENVIRONMENT environment..."
    docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE stop
    ;;
  start)
    echo "Starting previously stopped containers for $ENVIRONMENT environment..."
    docker compose -f $BASE_COMPOSE -f $COMPOSE_FILE start
    ;;
  *)
    echo "Invalid command: $COMMAND"
    usage
    ;;
esac
