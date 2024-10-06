# PENDT Docker Compose Management Script

This script simplifies the management of Docker Compose environments (`development` and `test`) by providing an easy way to execute common Docker commands using flags.

## Requirements

- Docker
- Docker Compose

## Usage

```bash
./pendt.sh [-e environment] [-c command] [-s service] [-r command to run]
```

### Parameters

- **`-e`**: Specify the environment (`dev` for development or `test` for testing).
- **`-c`**: Specify the Docker Compose command to execute (see [Available Commands](#available-commands)).
- **`-s`**: Specify a service (optional, used for commands like `logs`, `restart`, `exec`).
- **`-r`**: Command to run inside a container (optional, used with `exec`).

## Available Commands

### 1. **up**

Starts the containers for the specified environment.

- **Example**:
  ```bash
  ./pendt.sh -e dev -c up
  ```

### 2. **up-build**

Builds and starts the containers for the specified environment.

- **Example**:
  ```bash
  ./pendt.sh -e test -c up-build
  ```

### 3. **down**

Stops and removes the containers for the specified environment.

- **Example**:
  ```bash
  ./pendt.sh -e dev -c down
  ```

### 4. **logs**

Follows the logs for all services (or a specific service) in the specified environment.

- **All Services**:

  ```bash
  ./pendt.sh -e dev -c logs
  ```

- **Specific Service** (e.g., `server`):
  ```bash
  ./pendt.sh -e dev -c logs -s server
  ```

### 5. **ps**

Lists all running containers for the specified environment.

- **Example**:
  ```bash
  ./pendt.sh -e dev -c ps
  ```

### 6. **restart**

Restarts all containers or a specific service in the specified environment.

- **Restart All**:

  ```bash
  ./pendt.sh -e test -c restart
  ```

- **Restart a Specific Service** (e.g., `postgres`):
  ```bash
  ./pendt.sh -e dev -c restart -s postgres
  ```

### 7. **exec**

Runs a command inside a specific service container.

- **Example** (running `npm run migration` inside the `server` container):
  ```bash
  ./pendt.sh -e dev -c exec -s server -r "npm run migration"
  ```

### 8. **stop**

Stops all running containers for the specified environment (without removing them).

- **Example**:
  ```bash
  ./pendt.sh -e dev -c stop
  ```

### 9. **start**

Starts all previously stopped containers for the specified environment.

- **Example**:
  ```bash
  ./pendt.sh -e dev -c start
  ```

## Examples

- **Start development environment**:

  ```bash
  ./pendt.sh -e dev -c up
  ```

- **Build and start test environment**:

  ```bash
  ./pendt.sh -e test -c up-build
  ```

- **Stop containers for development**:

  ```bash
  ./pendt.sh -e dev -c stop
  ```

- **Follow logs for a specific service (server)**:

  ```bash
  ./pendt.sh -e dev -c logs -s server
  ```

- **Execute a command inside the `server` container**:
  ```bash
  ./pendt.sh -e dev -c exec -s server -r "npm run migration"
  ```
