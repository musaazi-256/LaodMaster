require 'xcodeproj'
require 'fileutils'
root = File.expand_path('../..', __dir__)
path = File.join(root, '.toolchains/ios-smoke')
FileUtils.mkdir_p(path)
project = Xcodeproj::Project.new(File.join(path, 'NativeSmoke.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'NativeSmoke', :ios, '16.4')
source = project.main_group.new_file(File.join(__dir__, 'SmokeTests.swift'))
target.source_build_phase.add_file_reference(source)
target.build_configurations.each do |config|
  config.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'ug.co.loadmaster.v2.nativeSmoke', 'GENERATE_INFOPLIST_FILE'=>'YES', 'SWIFT_VERSION'=>'5.0', 'CODE_SIGNING_ALLOWED'=>'NO', 'TARGETED_DEVICE_FAMILY'=>'1,2'})
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path, 'NativeSmoke', true)
