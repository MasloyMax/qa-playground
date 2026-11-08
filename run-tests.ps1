[CmdletBinding()]
param(
    [ValidateSet('all', 'ui', 'api')][string]$Suite = 'all',
    [switch]$Visible,
    [string]$Test,
    [string]$BaseUrl = 'http://127.0.0.1:3000',
    [string]$DriverPath
)
$ErrorActionPreference = 'Stop'
$previousJavaHome = $env:JAVA_HOME
$previousGradleHome = $env:GRADLE_USER_HOME
$projectPath = Join-Path $PSScriptRoot 'autotests'
$courseJdk = Join-Path $PSScriptRoot '..\..\.tools\jdk'
try {
    if (!$env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $courseJdk 'bin\javac.exe'))) {
        $env:JAVA_HOME = (Resolve-Path -LiteralPath $courseJdk).Path
    }
    if (!$env:JAVA_HOME -and !(Get-Command java.exe -ErrorAction SilentlyContinue)) {
        throw 'Install JDK 17+ and set JAVA_HOME, or choose a JDK in the IDE Gradle settings.'
    }
    $env:GRADLE_USER_HOME = Join-Path $PSScriptRoot '.runtime\gradle'
    $task = switch ($Suite) { 'ui' { 'uiTest' }; 'api' { 'apiTest' }; default { 'test' } }
    $gradleArguments = @('-p', $projectPath, $task, ('-PbaseUrl=' + $BaseUrl), '--console=plain')
    if ($Visible) { $gradleArguments += '-Pheadless=false' }
    if ($Test) { $gradleArguments += @('--tests', $Test) }
    if ($DriverPath) { $gradleArguments += '-PdriverPath=' + (Resolve-Path -LiteralPath $DriverPath).Path }
    & (Join-Path $projectPath 'gradlew.bat') @gradleArguments
    $testExitCode = $LASTEXITCODE
} finally {
    $env:JAVA_HOME = $previousJavaHome
    $env:GRADLE_USER_HOME = $previousGradleHome
}
exit $testExitCode
