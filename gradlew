#!/bin/sh

# Gradle wrapper. Если Android Studio попросит обновить wrapper — согласитесь.
# Этот файл должен оставаться исполняемым.

if [ -z "$JAVA_HOME" ]; then
  JAVA_CMD=java
else
  JAVA_CMD="$JAVA_HOME/bin/java"
fi

exec "$JAVA_CMD" -classpath "$(dirname "$0")/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
