#!/bin/bash

EC2_AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
EC2_REGION=$(echo $EC2_AVAILABILITY_ZONE | sed 's/[a-z]$//')

aws secretsmanager get-secret-value --secret-id codex-registry-api --region $EC2_REGION |
grep 'SecretString' |
sed -E $'s/.*\{\\\\"(.*)\\\\"\}.*/\\1/' |
sed -E $'s/\\\\":\\\\"/=/g' |
sed -E $'s/\\\\",\\\\"/\\\n/g' > /opt/process/.env
