import com.github.gradle.node.npm.task.NpmTask
import io.github.andreabrighi.gradle.gitsemver.conventionalcommit.ConventionalCommit

plugins {
    base
    alias(libs.plugins.node)
    alias(libs.plugins.gitSemVer)
}


buildscript {
    dependencies {
        classpath("io.github.andreabrighi:conventional-commit-strategy-for-git-sensitive-semantic-versioning-gradle-plugin:1.0.15")
    }
}

gitSemVer {
    commitNameBasedUpdateStrategy(ConventionalCommit::semanticVersionUpdate)
    minimumVersion.set("0.1.0")
}

node {
    version.set("22.19.0")
    download.set(true)
    nodeProjectDir.set(file(project.projectDir))
}

// Clean task
tasks.named("clean") {
    delete("dist", "docs")
}

tasks.register<Delete>("cleanAll") {
    group = "build"
    description = "Remove all generated files including node_modules"
    delete("dist", "docs", "node_modules")
}

// Dependencies
tasks.register<NpmTask>("npmCi") {
    group = "npm"
    description = "Install npm dependencies cleanly"
    args.set(listOf("ci"))
    inputs.file("package.json")
    inputs.file("package-lock.json")
    outputs.dir("node_modules")
}

// Build
tasks.register<NpmTask>("npmBuild") {
    group = "build"
    description = "Build the TypeScript project"
    dependsOn("npmCi")
    args.set(listOf("run", "build"))
    inputs.dir("src")
    inputs.file("tsconfig.json")
    outputs.dir("dist")
}

tasks.named("assemble") {
    dependsOn("npmBuild")
}

// Test
tasks.register<NpmTask>("npmTest") {
    group = "verification"
    description = "Run unit tests"
    args.set(listOf("run", "test"))
    inputs.dir("src")
    inputs.file("package.json")
}

tasks.named("check") {
    dependsOn("npmTest")
}

// Development
tasks.register<NpmTask>("startDev") {
    group = "application"
    description = "Start development server"
    args.set(listOf("run", "start:dev"))
}

tasks.register("devAll") {
    group = "application"
    description = "Clean, build, test and start dev server"
    dependsOn("cleanAll", "build", "check")
    finalizedBy("startDev")
}

// Code quality
tasks.register<NpmTask>("lint") {
    group = "verification"
    description = "Run lint"
    args.set(listOf("run", "lint"))
    inputs.dir("src")
    inputs.file("eslint.config.mts")
}

tasks.register<NpmTask>("lintFix") {
    group = "verification"
    description = "Fix lint issues"
    args.set(listOf("run", "lint:fix"))
}

tasks.register<NpmTask>("format") {
    group = "verification"
    description = "Format code"
    args.set(listOf("run", "format"))
}

// Documentation task
tasks.register<NpmTask>("docs") {
    group = "documentation"
    description = "Generate TypeDoc documentation"
    args.set(listOf("run", "docs"))
    inputs.dir("src")
    outputs.dir("docs")
}

// Production dependencies task
tasks.register<NpmTask>("installProdDependencies") {
    group = "npm"
    description = "Install only production dependencies for Docker"
    args.set(listOf("install", "--omit=dev"))
}

tasks.register<NpmTask>("preCommit") {
    group = "verification"
    description = "Run lint-staged"
    args.set(listOf("run", "lint-staged"))
}
