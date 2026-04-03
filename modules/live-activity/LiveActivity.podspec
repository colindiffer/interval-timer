require 'json'

Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Live Activity native module for Flash Interval Timer'
  s.author         = { 'Colin Differ' => 'colindiffer@gmail.com' }
  s.homepage       = 'https://github.com/colindiffer/interval-timer'
  s.license        = { :type => 'MIT' }
  s.platform       = :ios, '16.2'
  s.source         = { :git => 'https://github.com/colindiffer/interval-timer.git', :tag => s.version.to_s }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.{swift}'
end
