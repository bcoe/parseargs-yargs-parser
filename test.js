import {describe, it} from 'mocha';
import * as chai from 'chai';
import {expect} from 'chai';
import parser from './build/index.js';

chai.should();

// const fs = require('fs')
// const path = require('path')

describe('yargs-parser', function () {
  // it('should parse a "short boolean"', function () {
  //  const parse = parser(['-b'])
  //  parse.should.not.have.property('--')
  //  parse.should.have.property('b').to.be.ok.and.be.a('boolean')
  //  parse.should.have.property('_').with.length(0)
  //})

  it('should parse a "long boolean"', function () {
    const parse = parser(['--bool'])
    parse.should.not.have.property('--')
    parse.should.have.property('bool', true)
    parse.should.have.property('_').with.length(0)
  })
})
