require 'json'

Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Live Activity native module for Flash Interval Timer'
  s.author         = {}
  s.homepage       = 'https://github.com/colindiffer/interval-timer'
  s.license        = { :type => 'MIT' }
  s.platform       = :ios, '16.2'
  s.source         = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.{swift}'
end
