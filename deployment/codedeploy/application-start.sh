#!/bin/sh

# this makes sure nvm (and thus global npm packages) are in the path
# .bash_profile also loads the correct NODE_ENV exported in /etc/environment
source /home/ec2-user/.bash_profile

# copy secrets from aws secrets manager to the .env file
$(/opt/process/deployment/secrets-to-env.sh)

# tell pm2 to reload the application(s)
NODE_ENV=$NODE_ENV pm2 reload /opt/process/deployment/pm2/processes.yml
